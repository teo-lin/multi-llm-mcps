#!/bin/bash

# Interactive test of MCP packages via npx
# This provides more detailed testing and shows actual MCP responses
# Usage: ./test-npx-interactive.sh [package-name]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# If package name provided, test just that one
if [ -n "$1" ]; then
  PACKAGES=("$1")
else
  PACKAGES=(
    "@teolin/mcp-local-mysql"
    "@teolin/mcp-atlassian"
    "@teolin/mcp-azure-ad"
    "@teolin/mcp-cloudwatch-logs"
    "@teolin/code-review-agent"
    "@teolin/mcp-github"
    "@teolin/mcp-jira"
    "@teolin/mcp-kafdrop"
  )
fi

echo " Interactive MCP Package Testing via npx"
echo ""

for pkg in "${PACKAGES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " Testing: $pkg"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Create test script
  cat > /tmp/mcp-test.js << 'TESTEOF'
const { spawn } = require('child_process');
const pkg = process.argv[2];

console.log(`Starting ${pkg} via npx...`);

const mcp = spawn('npx', ['-y', pkg], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = [];
let stderr = [];

mcp.stdout.on('data', (data) => {
  output.push(data.toString());
});

mcp.stderr.on('data', (data) => {
  stderr.push(data.toString());
});

// Send initialize request
setTimeout(() => {
  const initMsg = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  mcp.stdin.write(JSON.stringify(initMsg) + '\n');
}, 1000);

// Send list tools request
setTimeout(() => {
  const listMsg = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  mcp.stdin.write(JSON.stringify(listMsg) + '\n');
}, 2000);

// Collect results and exit
setTimeout(() => {
  console.log('\n Results:');
  console.log('─────────────────────────────────────');

  if (stderr.length > 0) {
    console.log(' Server logs:');
    stderr.forEach(line => {
      if (line.trim()) console.log('  ', line.trim());
    });
  }

  if (output.length > 0) {
    console.log('\n MCP Responses:');
    output.forEach(line => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 1) {
          console.log('   Initialize response received');
        } else if (parsed.id === 2) {
          const tools = parsed.result?.tools || [];
          console.log(`   Tools list received: ${tools.length} tools`);
          tools.forEach(t => console.log(`     - ${t.name}`));
        }
      } catch (e) {
        // Not JSON, skip
      }
    });
  } else {
    console.log(' No MCP responses received');
  }

  mcp.kill();
  process.exit(0);
}, 3500);
TESTEOF

  node /tmp/mcp-test.js "$pkg"
  echo ""
done

rm -f /tmp/mcp-test.js

echo " Interactive testing complete!"
