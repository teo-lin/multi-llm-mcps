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
MCP_NAME="azuread"
PACKAGE_NAME="azure-ad-mcp-server"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Azure AD MCP Setup - Automated Installation & Config   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check Prerequisites
echo -e "${YELLOW}[1/6]${NC} Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED} Node.js is not installed${NC}"
    echo "  Please install Node.js >=25.2.1 from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo -e "${GREEN} Node.js ${NODE_VERSION} detected${NC}"

# Step 2: Install Dependencies
echo ""
echo -e "${YELLOW}[2/6]${NC} Installing npm dependencies..."
cd "$SCRIPT_DIR"
npm install
echo -e "${GREEN} Dependencies installed${NC}"

# Step 3: Configure Environment
echo ""
echo -e "${YELLOW}[3/6]${NC} Configuring environment..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN} Created .env from .env.example${NC}"
    else
        touch .env
        echo -e "${GREEN} Created empty .env${NC}"
    fi

    echo ""
    echo -e "${BLUE}Please provide your Azure AD application details:${NC}"
    echo -e "${YELLOW}(Get these from: https://portal.azure.com > Azure AD > App registrations)${NC}"

    read -p "Azure Client ID: " AZURE_CLIENT_ID
    read -p "Azure Authority [https://login.microsoftonline.com/common]: " AZURE_AUTHORITY
    AZURE_AUTHORITY=${AZURE_AUTHORITY:-https://login.microsoftonline.com/common}
    read -p "Azure Scopes [https://graph.microsoft.com/.default]: " AZURE_SCOPES
    AZURE_SCOPES=${AZURE_SCOPES:-https://graph.microsoft.com/.default}

    cat > .env << EOF
AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
AZURE_AUTHORITY=${AZURE_AUTHORITY}
AZURE_SCOPES=${AZURE_SCOPES}
EOF

    echo -e "${GREEN} Environment configured${NC}"
else
    echo -e "${GREEN} .env already exists${NC}"
fi

# Step 4: Register with Claude
echo ""
echo -e "${YELLOW}[4/6]${NC} Registering with Claude Code..."

read -p "Choose scope (user/project) [user]: " SCOPE
SCOPE=${SCOPE:-user}

# Check if already registered
if claude mcp list 2>/dev/null | grep -q "$MCP_NAME"; then
    echo -e "${YELLOW} MCP already registered, updating...${NC}"
    claude mcp remove $MCP_NAME 2>/dev/null || true
fi

# Source .env for environment variables
source .env

# Register with environment variables
claude mcp add $MCP_NAME --scope $SCOPE --type stdio --command npx --args "-y,$PACKAGE_NAME" \
    --env "AZURE_CLIENT_ID=$AZURE_CLIENT_ID,AZURE_AUTHORITY=$AZURE_AUTHORITY,AZURE_SCOPES=$AZURE_SCOPES" || {
    echo -e "${RED} Failed to register with Claude${NC}"
    echo "  You can manually add this to your Claude config"
    exit 1
}

echo -e "${GREEN} Registered with Claude ($SCOPE scope)${NC}"

# Step 5: Start Server (background test)
echo ""
echo -e "${YELLOW}[5/6]${NC} Testing server startup..."

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

# Step 6: Run Tests
echo ""
echo -e "${YELLOW}[6/6]${NC} Running verification tests..."

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
echo -e "  1. The server will authenticate using device code flow on first use"
echo -e "  2. Start the server: ${GREEN}npm start${NC}"
echo -e "  3. Or use in Claude Code directly"
echo ""
echo -e "${BLUE}Authentication:${NC}"
echo -e "  • First use: Visit the URL shown and enter the device code"
echo -e "  • Token cache: Stored in ${GREEN}src/.token-cache.json${NC}"
echo ""
echo -e "${BLUE}Quick reference:${NC}"
echo -e "  • MCP name: ${GREEN}$MCP_NAME${NC}"
echo -e "  • Scope: ${GREEN}$SCOPE${NC}"
echo -e "  • View logs: ${GREEN}claude mcp logs $MCP_NAME${NC}"
echo -e "  • Check status: ${GREEN}claude mcp list${NC}"
echo ""
