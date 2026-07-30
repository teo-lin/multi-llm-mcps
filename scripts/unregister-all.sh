#!/bin/bash

SERVERS=(mysql jira github code-review atlassian cloudwatch azuread sonarcloud onyx obsidian kafdrop msk)

# Detect available Claude profiles
PROFILES=()
for cmd in claude cc; do
  if command -v "$cmd" &>/dev/null; then
    PROFILES+=("$cmd")
  fi
done

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
echo " Verify with: ${PROFILES[0]:-claude} mcp list"
