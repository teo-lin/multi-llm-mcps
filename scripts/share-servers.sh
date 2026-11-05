#!/bin/bash
# macOS: runs each server that has a port in servers.sh as one launchd agent shared by all agent
# sessions, and points Claude's user-scope entry at http://127.0.0.1:<port>/mcp.
# A server with port "-" goes back to one process per session (stdio).
# Safe to run again: an agent restarts only when its plist changes. --restart: restart all (after a code change).

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/servers.sh"
LINK="${MCP_LINK:-$HOME/.mcp}" # stable path, see relink.sh

ok() { printf '  ok: %s\n' "$*"; }
skip() { printf '  skip: %s\n' "$*"; }
fail() { printf '  FAILED: %s\n' "$*" >&2; failed=1; }

[ "$(uname -s)" = Darwin ] || { skip "shared MCP servers need macOS launchd"; exit 0; }
restart=false
[ "${1:-}" = --restart ] && restart=true
failed=0

for tool in node claude jq curl; do
  command -v "$tool" >/dev/null 2>&1 || { fail "$tool not found"; exit 1; }
done
[ -d "$LINK/mcps" ] || { fail "$LINK missing: run scripts/relink.sh"; exit 1; }

# launchd starts with a bare PATH; the servers call gh, acli and aws.
agent_path=""
for tool in node gh acli aws; do
  dir="$(dirname "$(command -v "$tool" 2>/dev/null || echo /usr/bin/x)")"
  case ":$agent_path:" in *":$dir:"*) ;; *) agent_path="${agent_path:+$agent_path:}$dir" ;; esac
done
agent_path="$agent_path:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

uid="$(id -u)"
agents_dir="$HOME/Library/LaunchAgents"
logs_dir="$HOME/Library/Logs/mcps"
mkdir -p "$agents_dir" "$logs_dir"

claude_url() {
  jq --raw-output --arg name "$1" '.mcpServers[$name].url // empty' "$HOME/.claude.json" 2>/dev/null
}

responds() {
  curl --silent --fail --max-time 5 --output /dev/null --request POST "$1" \
    --header "Content-Type: application/json" --header "Accept: application/json, text/event-stream" \
    --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"share-servers","version":"1"}}}'
}

for entry in "${MCP_SERVERS[@]}"; do
  IFS=: read -r name dir _pkg port <<< "$entry"
  label="local.mcps.$name"
  plist="$agents_dir/$label.plist"
  server_dir="$LINK/mcps/$dir"

  if [ "$port" = "-" ]; then
    if [ -f "$plist" ]; then
      launchctl bootout "gui/$uid/$label" 2>/dev/null
      rm -f "$plist"
      claude mcp remove "$name" --scope user >/dev/null 2>&1
      claude mcp add "$name" "$server_dir/start-mcp.sh" --scope user >/dev/null && ok "$name: back to one process per session"
    else
      skip "$name: one process per session"
    fi
    continue
  fi

  url="http://127.0.0.1:$port/mcp"
  new_plist="$(cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(command -v node)</string>
    <string>--env-file-if-exists=$server_dir/.env</string>
    <string>$LINK/scripts/serve-http.js</string>
    <string>$server_dir/src/index.js</string>
    <string>$port</string>
  </array>
  <key>WorkingDirectory</key><string>$server_dir</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$agent_path</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ProcessType</key><string>Interactive</string>
  <key>StandardOutPath</key><string>$logs_dir/$name.log</string>
  <key>StandardErrorPath</key><string>$logs_dir/$name.log</string>
</dict>
</plist>
EOF
)"

  if [ "$(cat "$plist" 2>/dev/null)" = "$new_plist" ] && launchctl print "gui/$uid/$label" >/dev/null 2>&1; then
    if $restart; then
      launchctl kickstart -k "gui/$uid/$label" && ok "$name: restarted"
    else
      skip "$name: agent unchanged, running"
    fi
  else
    printf '%s\n' "$new_plist" > "$plist"
    launchctl bootout "gui/$uid/$label" 2>/dev/null
    launchctl bootstrap "gui/$uid" "$plist" && ok "$name: agent on port $port"
  fi

  # Point Claude at the URL only once the server answers; else the stdio entry stays.
  for _ in 1 2 3 4 5 6 7 8 9 10; do responds "$url" && break; sleep 1; done
  if ! responds "$url"; then
    fail "$name: no answer on $url (log: $logs_dir/$name.log)"
    continue
  fi
  if [ "$(claude_url "$name")" = "$url" ]; then
    skip "$name: Claude already uses $url"
  else
    claude mcp remove "$name" --scope user >/dev/null 2>&1
    claude mcp add --transport http --scope user "$name" "$url" >/dev/null && ok "$name: Claude uses $url"
  fi
done

exit "$failed"
