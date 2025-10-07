#!/bin/bash

echo "🗑️  Unregistering all MCP servers from Claude Code..."
echo ""

# Unregister each server from user config (--scope user)
echo "1/8 Unregistering MySQL server..."
claude mcp remove mysql --scope user 2>/dev/null || echo "  (not registered)"

echo "2/8 Unregistering Jira server..."
claude mcp remove jira --scope user 2>/dev/null || echo "  (not registered)"

echo "3/8 Unregistering GitHub server..."
claude mcp remove github --scope user 2>/dev/null || echo "  (not registered)"

echo "4/8 Unregistering CodeReview server..."
claude mcp remove code-review --scope user 2>/dev/null || echo "  (not registered)"

echo "5/8 Unregistering Atlassian server..."
claude mcp remove atlassian --scope user 2>/dev/null || echo "  (not registered)"

echo "6/8 Unregistering CloudWatch server..."
claude mcp remove cloudwatch --scope user 2>/dev/null || echo "  (not registered)"

echo "7/8 Unregistering AzureAD server..."
claude mcp remove azuread --scope user 2>/dev/null || echo "  (not registered)"

echo "8/8 Unregistering Kafdrop server..."
claude mcp remove kafdrop --scope user 2>/dev/null || echo "  (not registered)"

echo ""
echo "✅ All servers unregistered!"
echo ""
echo "📋 Verify with: claude mcp list"
