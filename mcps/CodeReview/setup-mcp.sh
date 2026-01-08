#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_NAME="codereview"
PACKAGE_NAME="code-review-mcp-server"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CodeReview MCP Setup - Automated Installation & Config   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check Prerequisites
echo -e "${YELLOW}[1/7]${NC} Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED} Node.js is not installed${NC}"
    echo "  Please install Node.js >=25.2.1 from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo -e "${GREEN} Node.js ${NODE_VERSION} detected${NC}"

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED} GitHub CLI (gh) is not installed${NC}"
    echo "  Please install from https://cli.github.com/"
    exit 1
fi
echo -e "${GREEN} GitHub CLI detected${NC}"

# Check Atlassian CLI
if ! command -v acli &> /dev/null; then
    echo -e "${YELLOW} Atlassian CLI (acli) not found${NC}"
    echo "  Installing Atlassian CLI..."
    npm install -g @atlassian/forge-cli || {
        echo -e "${RED} Failed to install Atlassian CLI${NC}"
        exit 1
    }
    echo -e "${GREEN} Atlassian CLI installed${NC}"
else
    echo -e "${GREEN} Atlassian CLI detected${NC}"
fi

# Step 2: Install Dependencies
echo ""
echo -e "${YELLOW}[2/7]${NC} Installing npm dependencies..."
cd "$SCRIPT_DIR"
npm install
echo -e "${GREEN} Dependencies installed${NC}"

# Step 3: Configure Environment
echo ""
echo -e "${YELLOW}[3/7]${NC} Configuring environment..."

if [ ! -f ".env" ]; then
    echo ""
    echo -e "${BLUE}Please provide configuration:${NC}"

    read -p "Jira instance URL (e.g., https://your-domain.atlassian.net): " JIRA_URL
    read -p "GitHub repository (e.g., owner/repo): " GITHUB_REPO

    cat > .env << EOF
JIRA_BASE_URL=${JIRA_URL}
GITHUB_REPO=${GITHUB_REPO}
EOF

    echo -e "${GREEN} Environment configured${NC}"
else
    echo -e "${GREEN} .env already exists${NC}"
fi

# Step 4: Authenticate CLIs
echo ""
echo -e "${YELLOW}[4/7]${NC} Authenticating required services..."

# GitHub CLI
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW} GitHub CLI not authenticated${NC}"
    gh auth login
fi

if gh auth status &>/dev/null; then
    echo -e "${GREEN} GitHub CLI authenticated${NC}"
else
    echo -e "${RED} GitHub authentication failed${NC}"
    exit 1
fi

# Atlassian CLI
source .env
if ! acli jira auth status 2>/dev/null | grep -q "\|authenticated\|logged in"; then
    echo -e "${YELLOW} Atlassian CLI not authenticated${NC}"
    acli jira auth login --url "$JIRA_BASE_URL"
fi

if acli jira auth status 2>/dev/null | grep -q "\|authenticated\|logged in"; then
    echo -e "${GREEN} Atlassian CLI authenticated${NC}"
else
    echo -e "${YELLOW} Atlassian CLI authentication verification failed${NC}"
    echo "  Code review will work with limited Jira features"
fi

# Step 5: Register with Claude
echo ""
echo -e "${YELLOW}[5/7]${NC} Registering with Claude Code..."

read -p "Choose scope (user/project) [user]: " SCOPE
SCOPE=${SCOPE:-user}

# Check if already registered
if claude mcp list 2>/dev/null | grep -q "$MCP_NAME"; then
    echo -e "${YELLOW} MCP already registered, updating...${NC}"
    claude mcp remove $MCP_NAME 2>/dev/null || true
fi

# Register
claude mcp add $MCP_NAME --scope $SCOPE --type stdio --command npx --args "-y,$PACKAGE_NAME" || {
    echo -e "${RED} Failed to register with Claude${NC}"
    echo "  You can manually add this to your Claude config"
    exit 1
}

echo -e "${GREEN} Registered with Claude ($SCOPE scope)${NC}"

# Step 6: Start Server (background test)
echo ""
echo -e "${YELLOW}[6/7]${NC} Testing server startup..."

# Start server in background for testing
npm start &
SERVER_PID=$!
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN} Server started successfully (PID: $SERVER_PID)${NC}"
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${RED} Server failed to start${NC}"
    exit 1
fi

# Step 7: Run Tests
echo ""
echo -e "${YELLOW}[7/7]${NC} Running verification tests..."

if npm run test &>/dev/null; then
    npm test || echo -e "${YELLOW} Tests not available or failed${NC}"
else
    echo -e "${YELLOW} No tests found, skipping...${NC}"
fi

# Success Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Setup Complete!                         ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Start the server: ${GREEN}npm start${NC}"
echo -e "  2. Or use in Claude Code to review PRs"
echo ""
echo -e "${BLUE}Features:${NC}"
echo -e "  • PR analysis with GitHub integration"
echo -e "  • Jira ticket integration"
echo -e "  • Automated code review comments"
echo ""
echo -e "${BLUE}Quick reference:${NC}"
echo -e "  • MCP name: ${GREEN}$MCP_NAME${NC}"
echo -e "  • Scope: ${GREEN}$SCOPE${NC}"
echo -e "  • View logs: ${GREEN}claude mcp logs $MCP_NAME${NC}"
echo ""
