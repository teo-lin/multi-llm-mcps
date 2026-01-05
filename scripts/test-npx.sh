#!/bin/bash

# Test all MCP packages via npx to verify they work as published
# This simulates how users will actually install and run the packages
# Usage: ./test-npx.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

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

passed=0
failed=0
failed_packages=()

echo "🚀 Testing MCP packages via npx (npm installation test)..."
echo "⚠️  Note: This tests published versions on npm"
echo ""

for pkg in "${PACKAGES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Testing: $pkg"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Create a test that sends initialize and list tools commands
  cat > /tmp/mcp-test-input.json << 'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF

  # Run npx and capture output (with timeout if available)
  if command -v timeout >/dev/null 2>&1; then
    timeout 5s npx -y "$pkg" < /tmp/mcp-test-input.json > /tmp/mcp-test-output.txt 2>&1
    exit_code=$?
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout 5s npx -y "$pkg" < /tmp/mcp-test-input.json > /tmp/mcp-test-output.txt 2>&1
    exit_code=$?
  else
    # No timeout available, use background process with kill
    npx -y "$pkg" < /tmp/mcp-test-input.json > /tmp/mcp-test-output.txt 2>&1 &
    pid=$!
    sleep 5
    kill $pid 2>/dev/null
    exit_code=124  # Simulate timeout exit code
  fi

  if [ $exit_code -eq 0 ] || [ $exit_code -eq 124 ]; then
    # Check if we got valid MCP responses
    if grep -q '"jsonrpc":"2.0"' /tmp/mcp-test-output.txt && \
       (grep -q '"result"' /tmp/mcp-test-output.txt || grep -q '"capabilities"' /tmp/mcp-test-output.txt); then
      echo "✅ $pkg: Server started and responded to MCP protocol"
      passed=$((passed+1))
    else
      echo "⚠️  $pkg: Server started but MCP protocol response unclear"
      # Show first few lines of output for debugging
      echo "Output preview:"
      head -5 /tmp/mcp-test-output.txt
      failed=$((failed+1))
      failed_packages+=("$pkg (protocol error)")
    fi
  else
    if [ $exit_code -eq 124 ]; then
      # Timeout - server might be waiting for more input, which is actually OK
      if grep -q '"jsonrpc":"2.0"' /tmp/mcp-test-output.txt; then
        echo "✅ $pkg: Server started successfully (timed out waiting for input)"
        passed=$((passed+1))
      else
        echo "❌ $pkg: Failed to start or respond"
        echo "Output:"
        cat /tmp/mcp-test-output.txt
        failed=$((failed+1))
        failed_packages+=("$pkg (timeout)")
      fi
    else
      echo "❌ $pkg: Failed to start (exit code: $exit_code)"
      echo "Output:"
      cat /tmp/mcp-test-output.txt
      failed=$((failed+1))
      failed_packages+=("$pkg (exit $exit_code)")
    fi
  fi

  echo ""
done

# Cleanup
rm -f /tmp/mcp-test-input.json /tmp/mcp-test-output.txt

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 NPX Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total packages: ${#PACKAGES[@]}"
echo "✅ Passed: $passed"
echo "❌ Failed: $failed"

if [ $failed -gt 0 ]; then
  echo ""
  echo "Failed packages:"
  for pkg in "${failed_packages[@]}"; do
    echo "  • $pkg"
  done
  echo ""
  echo "💡 Tip: Failed packages may not be published yet or have issues with npm installation"
  exit 1
else
  echo ""
  echo "✨ All npx tests passed!"
  echo "📦 All packages are installable and runnable via npx"
  exit 0
fi
