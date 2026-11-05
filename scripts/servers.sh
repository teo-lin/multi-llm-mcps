#!/bin/bash

# Single source of truth for every script under scripts/. Add an MCP here only.
# Format: registered-name:directory:npm-package:port
# port: macOS runs one shared server on it for all agent sessions (scripts/share-servers.sh).
# "-" = one process per session. Browser: a shared one would let sessions see each other's pages.
MCP_SERVERS=(
  "browser:Browser:@teolin/mcp-browser:-"
  "mysql:MySQL:@teolin/mcp-local-mysql:7341"
  "jira:Jira:@teolin/mcp-jira:7342"
  "github:GitHub:@teolin/mcp-github:7343"
  "code-review:CodeReview:@teolin/code-review-agent:7344"
  "atlassian:Atlassian:@teolin/mcp-atlassian:7345"
  "cloudwatch:CloudWatch:@teolin/mcp-cloudwatch-logs:7346"
  "azuread:AzureAD:@teolin/mcp-azure-ad:7347"
  "sonarcloud:SonarCloud:@teolin/mcp-sonarcloud:7348"
  "onyx:Onyx:@teolin/mcp-onyx:7349"
  "obsidian:Obsidian:@teolin/mcp-obsidian:7350"
)

# Not working: never registered, installed or tested. Still unregistered, to clear old entries.
MCP_DISABLED=(
  "kafdrop:Kafdrop"
  "msk:MSK"
)

mcp_names() {
  local entry
  for entry in "${MCP_SERVERS[@]}"; do echo "${entry%%:*}"; done
}

mcp_dirs() {
  local entry rest
  for entry in "${MCP_SERVERS[@]}"; do rest="${entry#*:}"; echo "${rest%%:*}"; done
}

mcp_packages() {
  local entry name dir pkg port
  for entry in "${MCP_SERVERS[@]}"; do IFS=: read -r name dir pkg port <<< "$entry"; echo "$pkg"; done
}
