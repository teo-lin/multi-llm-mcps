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
MCP_NAME="obsidian"
PACKAGE_NAME="@teolin/mcp-obsidian"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Obsidian MCP Setup - Automated Installation & Config    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check Prerequisites
echo -e "${YELLOW}[1/5]${NC} Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED} Node.js is not installed${NC}"
    echo "  Please install Node.js >=18 from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2)
echo -e "${GREEN} Node.js ${NODE_VERSION} detected${NC}"

# Step 2: .env
echo ""
echo -e "${YELLOW}[2/5]${NC} Configuring vault path..."
cd "$SCRIPT_DIR"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW} Created .env from template — edit VAULT_PATH before use${NC}"
fi
VAULT_PATH_VALUE=$(grep -E '^VAULT_PATH=' .env | cut -d'=' -f2-)
if [ -z "$VAULT_PATH_VALUE" ] || [ ! -d "$VAULT_PATH_VALUE" ]; then
    echo -e "${RED} VAULT_PATH in .env is empty or not a directory: '${VAULT_PATH_VALUE}'${NC}"
    echo "  Edit .env and set VAULT_PATH to your vault's absolute path."
    exit 1
fi
echo -e "${GREEN} VAULT_PATH = ${VAULT_PATH_VALUE}${NC}"

# Step 3: Install Dependencies
echo ""
echo -e "${YELLOW}[3/5]${NC} Installing npm dependencies..."
npm install
echo -e "${GREEN} Dependencies installed${NC}"

# Step 4: Register with Claude
echo ""
echo -e "${YELLOW}[4/5]${NC} Registering with Claude Code..."
read -p "Choose scope (user/project) [user]: " SCOPE
SCOPE=${SCOPE:-user}

if claude mcp list 2>/dev/null | grep -q "$MCP_NAME"; then
    echo -e "${YELLOW} MCP already registered, updating...${NC}"
    claude mcp remove $MCP_NAME 2>/dev/null || true
fi

# Register to run the local server (uses this dir's .env for VAULT_PATH)
claude mcp add $MCP_NAME --scope $SCOPE --type stdio --command "$SCRIPT_DIR/start-mcp.sh" || {
    echo -e "${RED} Failed to register with Claude${NC}"
    echo "  You can manually add this to your Claude config"
    exit 1
}
echo -e "${GREEN} Registered with Claude ($SCOPE scope)${NC}"

# Step 5: Run Tests
echo ""
echo -e "${YELLOW}[5/5]${NC} Running verification tests..."
npm test || { echo -e "${RED} Tests failed${NC}"; exit 1; }

# Success Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Setup Complete!                         ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${BLUE}Available tools:${NC}"
echo -e "  • read_file   - read a vault file"
echo -e "  • write_file  - create/overwrite (denied under raw/)"
echo -e "  • append_file - append (denied under raw/)"
echo -e "  • list_dir    - list a directory"
echo -e "  • search      - recursive regex search"
echo ""
echo -e "${BLUE}Quick reference:${NC}"
echo -e "  • MCP name: ${GREEN}$MCP_NAME${NC}"
echo -e "  • For Claude Desktop: add to claude_desktop_config.json (see README)"
echo ""
