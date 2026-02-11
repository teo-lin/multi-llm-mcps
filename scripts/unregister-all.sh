#!/bin/bash

echo "  Unregistering all MCP servers from Claude Code..."
echo ""

# Unregister each server from user config (--scope user)
echo "1/10 Unregistering MySQL server..."
claude mcp remove mysql --scope user 2>/dev/null || echo "  (not registered)"

echo "2/10 Unregistering Jira server..."
claude mcp remove jira --scope user 2>/dev/null || echo "  (not registered)"

echo "3/10 Unregistering GitHub server..."
claude mcp remove github --scope user 2>/dev/null || echo "  (not registered)"

echo "4/10 Unregistering CodeReview server..."
claude mcp remove code-review --scope user 2>/dev/null || echo "  (not registered)"

echo "5/10 Unregistering Atlassian server..."
claude mcp remove atlassian --scope user 2>/dev/null || echo "  (not registered)"

echo "6/10 Unregistering CloudWatch server..."
claude mcp remove cloudwatch --scope user 2>/dev/null || echo "  (not registered)"

echo "7/10 Unregistering AzureAD server..."
claude mcp remove azuread --scope user 2>/dev/null || echo "  (not registered)"

echo "8/10 Unregistering Kafdrop server..."
claude mcp remove kafdrop --scope user 2>/dev/null || echo "  (not registered)"

echo "9/10 Unregistering SonarCloud server..."
claude mcp remove sonarcloud --scope user 2>/dev/null || echo "  (not registered)"

echo "10/10 Unregistering MSK server..."
claude mcp remove msk --scope user 2>/dev/null || echo "  (not registered)"

echo ""
echo " All servers unregistered!"
echo ""
echo " Verify with: claude mcp list"
