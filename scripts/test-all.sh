#!/bin/bash

# Test all MCP servers
# This script runs tests for all 8 MCP servers and reports results

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# MCP directories
MCPS=(
  "Atlassian"
  "AzureAD"
  "CloudWatch"
  "CodeReview"
  "GitHub"
  "Jira"
  "Kafdrop"
  "MySQL"
)

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Testing All MCP Servers              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

passed=0
failed=0
declare -a failed_mcps

for mcp in "${MCPS[@]}"; do
  mcp_dir="$BASE_DIR/$mcp"

  if [ ! -d "$mcp_dir" ]; then
    echo -e "${RED}⚠️  $mcp: Directory not found${NC}"
    ((failed++))
    failed_mcps+=("$mcp (not found)")
    continue
  fi

  if [ ! -f "$mcp_dir/package.json" ]; then
    echo -e "${YELLOW}⚠️  $mcp: No package.json${NC}"
    ((failed++))
    failed_mcps+=("$mcp (no package.json)")
    continue
  fi

  echo -e "${BLUE}Testing $mcp...${NC}"

  if (cd "$mcp_dir" && npm test --silent 2>&1); then
    echo -e "${GREEN}✅ $mcp: PASSED${NC}"
    ((passed++))
  else
    echo -e "${RED}❌ $mcp: FAILED${NC}"
    ((failed++))
    failed_mcps+=("$mcp")
  fi

  echo ""
done

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Summary                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total MCPs:  ${BLUE}${#MCPS[@]}${NC}"
echo -e "Passed:      ${GREEN}$passed${NC}"
echo -e "Failed:      ${RED}$failed${NC}"
echo ""

if [ $failed -gt 0 ]; then
  echo -e "${RED}Failed MCPs:${NC}"
  for failed_mcp in "${failed_mcps[@]}"; do
    echo -e "  ${RED}• $failed_mcp${NC}"
  done
  echo ""
  exit 1
else
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  echo ""
  exit 0
fi
