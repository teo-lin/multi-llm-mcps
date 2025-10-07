#!/bin/bash

echo "🗑️  Unregistering all MCP servers from Claude Code..."
echo ""

# Unregister each server from user config (--scope user)
echo "1/7 Unregistering MySQL server..."
claude mcp remove mysql --scope user 2>/dev/null || echo "  (not registered)"

echo "2/7 Unregistering Jira server..."
claude mcp remove jira --scope user 2>/dev/null || echo "  (not registered)"

echo "3/7 Unregistering GitHub server..."
claude mcp remove github --scope user 2>/dev/null || echo "  (not registered)"

echo "4/7 Unregistering CodeReview server..."
claude mcp remove code-review --scope user 2>/dev/null || echo "  (not registered)"

echo "5/7 Unregistering Atlassian server..."
claude mcp remove atlassian --scope user 2>/dev/null || echo "  (not registered)"

echo "6/7 Unregistering CloudWatch server..."
claude mcp remove cloudwatch --scope user 2>/dev/null || echo "  (not registered)"

echo "7/7 Unregistering AzureAD server..."
claude mcp remove azuread --scope user 2>/dev/null || echo "  (not registered)"

echo ""
echo "✅ All servers unregistered!"
echo ""
echo "📋 Verify with: claude mcp list"
