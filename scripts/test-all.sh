#!/bin/bash

# Test all MCP packages
# Usage: ./test-all.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCPS_DIR="$SCRIPT_DIR/../mcps"

cd "$MCPS_DIR"

PACKAGES=(
  "MySQL"
  "Atlassian"
  "AzureAD"
  "CloudWatch"
  "CodeReview"
  "GitHub"
  "Jira"
  "Kafdrop"
  "SonarCloud"
)

passed=0
failed=0
failed_packages=()

echo " Running tests for all MCP packages..."
echo ""

for pkg in "${PACKAGES[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " Testing: $pkg"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ -d "$pkg" ]; then
    if (cd "$pkg" && npm test 2>&1); then
      echo " $pkg: PASSED"
      passed=$((passed+1))
    else
      echo " $pkg: FAILED"
      failed=$((failed+1))
      failed_packages+=("$pkg")
    fi
  else
    echo "  $pkg: Directory not found"
    failed=$((failed+1))
    failed_packages+=("$pkg (not found)")
  fi

  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total packages: ${#PACKAGES[@]}"
echo " Passed: $passed"
echo " Failed: $failed"

if [ $failed -gt 0 ]; then
  echo ""
  echo "Failed packages:"
  for pkg in "${failed_packages[@]}"; do
    echo "  • $pkg"
  done
  exit 1
else
  echo ""
  echo " All tests passed!"
  exit 0
fi
