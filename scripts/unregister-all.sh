#!/bin/bash

echo "🗑️  Unregistering all MCP servers from Claude Code..."
echo ""

# Unregister each server
echo "1/6 Unregistering MySQL server..."
claude mcp remove mysql 2>/dev/null || echo "  (not registered)"

echo "2/6 Unregistering Jira server..."
claude mcp remove jira 2>/dev/null || echo "  (not registered)"

echo "3/6 Unregistering GitHub server..."
claude mcp remove github 2>/dev/null || echo "  (not registered)"

echo "4/6 Unregistering CodeReview server..."
claude mcp remove code-review 2>/dev/null || echo "  (not registered)"

echo "5/6 Unregistering Atlassian server..."
claude mcp remove atlassian 2>/dev/null || echo "  (not registered)"

echo "6/6 Unregistering CloudWatch server..."
claude mcp remove cloudwatch 2>/dev/null || echo "  (not registered)"

echo ""
echo "✅ All servers unregistered!"
echo ""
echo "📋 Verify with: claude mcp list"
