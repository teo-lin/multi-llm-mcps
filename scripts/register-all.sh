#!/bin/bash

# Register through a stable symlink (~/.mcp) rather than this repo's real path, so
# renaming or moving the repo does not break the registrations — only relink.sh needs
# to be re-run. See scripts/relink.sh.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT_DIR/scripts/relink.sh" || exit 1
MCP_DIR="${MCP_LINK:-$HOME/.mcp}/mcps"

# Registered name : directory under mcps/ (names are not derivable from the directory
# name — cloudwatch/azuread/sonarcloud are flattened, code-review is kebab-cased).
SERVERS=(
  "mysql:MySQL"
  "jira:Jira"
  "github:GitHub"
  "code-review:CodeReview"
  "atlassian:Atlassian"
  "cloudwatch:CloudWatch"
  "azuread:AzureAD"
  "sonarcloud:SonarCloud"
  "onyx:Onyx"
  "obsidian:Obsidian"
  "kafdrop:Kafdrop"
  "msk:MSK"
)

# Detect available Claude profiles
PROFILES=()
for cmd in claude cc; do
  if command -v "$cmd" &>/dev/null; then
    PROFILES+=("$cmd")
  fi
done

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
    IFS=: read -r name dir <<< "${SERVERS[$i]}"
    echo "  $((i+1))/${#SERVERS[@]} Registering $name..."
    if [ "$profile" = "cc" ]; then
      CLAUDE_CONFIG_DIR=~/.cc claude mcp add "$name" "$MCP_DIR/$dir/start-mcp.sh" --scope user 2>/dev/null || echo "    (failed)"
    else
      claude mcp add "$name" "$MCP_DIR/$dir/start-mcp.sh" --scope user 2>/dev/null || echo "    (failed)"
    fi
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
