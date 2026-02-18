#!/bin/bash

# Get the absolute path to the project root and MCP servers directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_DIR="$ROOT_DIR/mcps"

SERVERS=(
  "mysql:MySQL"
  "jira:Jira"
  "github:GitHub"
  "code-review:CodeReview"
  "atlassian:Atlassian"
  "cloudwatch:CloudWatch"
  "azuread:AzureAD"
  "sonarcloud:SonarCloud"
)

echo " Registering all MCP servers with Claude Code..."
echo " MCP Directory: $MCP_DIR"
echo " Profiles found: claude cc"
echo ""

for profile in claude cc; do
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
echo " Verify with: ${PROFILES[0]} mcp list"
echo ""
echo "  Note: Some servers may show as 'Failed to connect' until you:"
echo "   - Configure .env files (MySQL, Jira, CloudWatch, AzureAD)"
echo "   - Authenticate CLIs (GitHub: gh auth login, Atlassian: acli auth login)"
