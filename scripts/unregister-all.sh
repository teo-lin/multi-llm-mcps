#!/bin/bash

SERVERS=(mysql jira github code-review atlassian cloudwatch azuread sonarcloud)

echo "  Unregistering all MCP servers from Claude Code..."
echo " Profiles found: claude cc"
echo ""

for profile in claude cc; do
  echo "  Profile: $profile"
  for i in "${!SERVERS[@]}"; do
    echo "  $((i+1))/${#SERVERS[@]} Unregistering ${SERVERS[$i]}..."
    if [ "$profile" = "cc" ]; then
      CLAUDE_CONFIG_DIR=~/.cc claude mcp remove "${SERVERS[$i]}" --scope user 2>/dev/null || echo "    (not registered)"
    else
      claude mcp remove "${SERVERS[$i]}" --scope user 2>/dev/null || echo "    (not registered)"
    fi
  done
  echo ""
done

echo " All servers unregistered!"
echo ""
echo " Verify with: ${PROFILES[0]} mcp list"
