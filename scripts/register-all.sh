#!/bin/bash

# Register through a stable symlink (~/.mcp) rather than this repo's real path, so
# renaming or moving the repo does not break the registrations — only relink.sh needs
# to be re-run. See scripts/relink.sh.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/servers.sh"
"$ROOT_DIR/scripts/relink.sh" || exit 1
MCP_DIR="${MCP_LINK:-$HOME/.mcp}/mcps"

SERVERS=("${MCP_SERVERS[@]}")

# Detect available Claude profiles
PROFILES=()
if command -v claude &>/dev/null; then
  PROFILES+=("claude")
fi

if [ ${#PROFILES[@]} -eq 0 ]; then
  echo "  No Claude CLI found (tried: claude, cc). Please install Claude Code first."
  exit 1
fi

echo " Registering all MCP servers with Claude Code..."
echo " MCP Directory: $MCP_DIR"
echo " Profiles found: ${PROFILES[*]}"
echo ""

for profile in "${PROFILES[@]}"; do
  echo "  Profile: $profile"
  for i in "${!SERVERS[@]}"; do
    IFS=: read -r name dir _pkg <<< "${SERVERS[$i]}"
    echo "  $((i+1))/${#SERVERS[@]} Registering $name..."
    claude mcp add "$name" "$MCP_DIR/$dir/start-mcp.sh" --scope user 2>/dev/null || echo "    (failed)"
  done
  echo ""
done

echo " All servers registered!"
echo ""
echo " Verify with: ${PROFILES[0]:-claude} mcp list"
echo ""
echo "  Note: Some servers may show as 'Failed to connect' until you:"
echo "   - Configure .env files (MySQL, Jira, CloudWatch, AzureAD)"
echo "   - Authenticate CLIs (GitHub: gh auth login, Atlassian: acli auth login)"
