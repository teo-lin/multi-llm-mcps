#!/bin/bash

# Single source of truth for every script under scripts/. Add an MCP here only.
# Format: registered-name:directory:npm-package
MCP_SERVERS=(
  "browser:Browser:@teolin/mcp-browser"
  "mysql:MySQL:@teolin/mcp-local-mysql"
  "jira:Jira:@teolin/mcp-jira"
  "github:GitHub:@teolin/mcp-github"
  "code-review:CodeReview:@teolin/code-review-agent"
  "atlassian:Atlassian:@teolin/mcp-atlassian"
  "cloudwatch:CloudWatch:@teolin/mcp-cloudwatch-logs"
  "azuread:AzureAD:@teolin/mcp-azure-ad"
  "sonarcloud:SonarCloud:@teolin/mcp-sonarcloud"
  "onyx:Onyx:@teolin/mcp-onyx"
  "obsidian:Obsidian:@teolin/mcp-obsidian"
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
  local entry
  for entry in "${MCP_SERVERS[@]}"; do echo "${entry##*:}"; done
}
