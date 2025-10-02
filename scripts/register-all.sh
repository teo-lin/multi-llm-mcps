#!/bin/bash

# Get the absolute path to the MCP servers directory
MCP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Registering all MCP servers with Claude Code..."
echo "📂 MCP Directory: $MCP_DIR"
echo ""

# Register each server
echo "1/6 Registering MySQL server..."
claude mcp add mysql "$MCP_DIR/MySQL/start-mcp.sh"

echo "2/6 Registering Jira server..."
claude mcp add jira "$MCP_DIR/Jira/start-mcp.sh"

echo "3/6 Registering GitHub server..."
claude mcp add github "$MCP_DIR/GitHub/start-mcp.sh"

echo "4/6 Registering CodeReview server..."
claude mcp add code-review "$MCP_DIR/CodeReview/start-mcp.sh"

echo "5/6 Registering Atlassian server..."
claude mcp add atlassian "$MCP_DIR/Atlassian/start-mcp.sh"

echo "6/6 Registering CloudWatch server..."
claude mcp add cloudwatch "$MCP_DIR/CloudWatch/start-mcp.sh"

echo ""
echo "✅ All servers registered!"
echo ""
echo "📋 Verify with: claude mcp list"
echo ""
echo "⚠️  Note: Some servers may show as 'Failed to connect' until you:"
echo "   - Configure .env files (MySQL, Jira, CloudWatch)"
echo "   - Authenticate CLIs (GitHub: gh auth login, Atlassian: acli auth login)"
