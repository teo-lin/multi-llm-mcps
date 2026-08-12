#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/servers.sh"

# Disabled servers included too, so old registrations do not linger.
SERVERS=($(mcp_names))
for entry in "${MCP_DISABLED[@]}"; do
  SERVERS+=("${entry%%:*}")
done

# Detect available Claude profiles
PROFILES=()
if command -v claude &>/dev/null; then
  PROFILES+=("claude")
fi

if [ ${#PROFILES[@]} -eq 0 ]; then
  echo "  No Claude CLI found (tried: claude, cc). Nothing to unregister."
  exit 0
fi

echo "  Unregistering all MCP servers from Claude Code..."
echo " Profiles found: ${PROFILES[*]}"
echo ""

for profile in "${PROFILES[@]}"; do
  echo "  Profile: $profile"
  for i in "${!SERVERS[@]}"; do
    echo "  $((i+1))/${#SERVERS[@]} Unregistering ${SERVERS[$i]}..."
    claude mcp remove "${SERVERS[$i]}" --scope user 2>/dev/null || echo "    (not registered)"
  done
  echo ""
done

echo " All servers unregistered!"
echo ""
echo " Verify with: ${PROFILES[0]:-claude} mcp list"
