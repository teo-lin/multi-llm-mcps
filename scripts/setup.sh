#!/bin/bash

set -e  # Exit on error

echo "🚀 Setting up Claude MCP Servers..."
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

echo "📋 Detected platform: $PLATFORM"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# =============================================================================
# 1. Check and install Homebrew (macOS only)
# =============================================================================
if [ "$PLATFORM" = "Mac" ]; then
    echo "🍺 Checking Homebrew..."
    if ! command_exists brew; then
        echo "⚠️  Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [ -f "/usr/local/bin/brew" ]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    else
        echo "✅ Homebrew already installed"
    fi
    echo ""
fi

# =============================================================================
# 2. Check and install NVM
# =============================================================================
echo "📦 Checking NVM..."
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "⚠️  NVM not found. Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    # Load NVM
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
    echo "✅ NVM already installed"
    # Load NVM
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
echo ""

# =============================================================================
# 3. Install Node.js from .nvmrc
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NVMRC_PATH="$SCRIPT_DIR/../.nvmrc"

if [ -f "$NVMRC_PATH" ]; then
    NODE_VERSION=$(cat "$NVMRC_PATH")
    echo "📦 Installing Node.js $NODE_VERSION from .nvmrc..."
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    echo "✅ Node.js $(node --version) active"
else
    echo "⚠️  .nvmrc not found, using default Node version"
fi
echo ""

# =============================================================================
# 4. Check and install Claude CLI
# =============================================================================
echo "🤖 Checking Claude CLI..."
if ! command_exists claude; then
    echo "⚠️  Claude CLI not found. Installing..."
    if [ "$PLATFORM" = "Mac" ]; then
        brew install anthropics/claude/claude
    elif [ "$PLATFORM" = "Linux" ]; then
        echo "❌ Please install Claude CLI manually from: https://docs.anthropic.com/en/docs/claude-code/installation"
        echo "   After installation, run this script again."
        exit 1
    fi
else
    echo "✅ Claude CLI already installed ($(claude --version 2>&1 | head -1))"
fi
echo ""

# =============================================================================
# 5. Check and install GitHub CLI
# =============================================================================
echo "🐙 Checking GitHub CLI..."
if ! command_exists gh; then
    echo "⚠️  GitHub CLI not found. Installing..."
    if [ "$PLATFORM" = "Mac" ]; then
        brew install gh
    elif [ "$PLATFORM" = "Linux" ]; then
        # Debian/Ubuntu
        if command_exists apt-get; then
            sudo mkdir -p -m 755 /etc/apt/keyrings
            wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
            sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt-get update
            sudo apt-get install gh -y
        # Fedora/RHEL
        elif command_exists dnf; then
            sudo dnf install 'dnf-command(config-manager)' -y
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            sudo dnf install gh -y
        else
            echo "❌ Please install GitHub CLI manually from: https://cli.github.com/manual/installation"
            echo "   After installation, run this script again."
        fi
    fi
else
    echo "✅ GitHub CLI already installed ($(gh --version | head -1))"
fi

# Check GitHub authentication
if command_exists gh; then
    if ! gh auth status &> /dev/null; then
        echo "⚠️  GitHub CLI not authenticated. Please run: gh auth login"
        echo "   (You can do this after setup completes)"
    else
        echo "✅ GitHub CLI authenticated"
    fi
fi
echo ""

# =============================================================================
# 6. Check Atlassian CLI (optional - will warn if missing)
# =============================================================================
echo "🌊 Checking Atlassian CLI..."
if ! command_exists acli; then
    echo "⚠️  Atlassian CLI not found (optional - needed for CodeReview and Atlassian MCPs)"
    echo "   Install from: https://bobswift.atlassian.net/wiki/spaces/ACLI/overview"
    echo "   Or install via npm: npm install -g @atlassian/forge-cli"
else
    echo "✅ Atlassian CLI already installed"
fi
echo ""

# =============================================================================
# 7. Check AWS CLI (optional - will warn if missing)
# =============================================================================
echo "☁️  Checking AWS CLI..."
if ! command_exists aws; then
    echo "⚠️  AWS CLI not found (optional - needed for CloudWatch MCP)"
    if [ "$PLATFORM" = "Mac" ]; then
        echo "   Install with: brew install awscli"
    elif [ "$PLATFORM" = "Linux" ]; then
        echo "   Install from: https://aws.amazon.com/cli/"
    fi
else
    echo "✅ AWS CLI already installed ($(aws --version))"
fi
echo ""

# Get the absolute path to the MCP servers directory
MCP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MCP_DIR"

echo "📂 MCP Directory: $MCP_DIR"
echo ""

# Install root dependencies
echo "📦 Installing shared dependencies..."
npm install
echo ""

# Install dependencies for each MCP server
echo "📦 Installing MCP server dependencies..."
echo ""

echo "1/8 Installing MySQL dependencies..."
cd "$MCP_DIR/MySQL" && npm install

echo "2/8 Installing Jira dependencies..."
cd "$MCP_DIR/Jira" && npm install

echo "3/8 Installing GitHub dependencies..."
cd "$MCP_DIR/GitHub" && npm install

echo "4/8 Installing CodeReview dependencies..."
cd "$MCP_DIR/CodeReview" && npm install

echo "5/8 Installing Atlassian dependencies..."
cd "$MCP_DIR/Atlassian" && npm install

echo "6/8 Installing CloudWatch dependencies..."
cd "$MCP_DIR/CloudWatch" && npm install

echo "7/8 Installing AzureAD dependencies..."
cd "$MCP_DIR/AzureAD" && npm install

echo "8/8 Installing Kafdrop dependencies..."
cd "$MCP_DIR/Kafdrop" && npm install

echo ""
echo "📝 Setting up .env files..."

# Function to copy .env.example to .env if it doesn't exist
setup_env() {
    local dir=$1
    local name=$2

    if [ -f "$MCP_DIR/$dir/.env.example" ]; then
        if [ ! -f "$MCP_DIR/$dir/.env" ]; then
            cp "$MCP_DIR/$dir/.env.example" "$MCP_DIR/$dir/.env"
            echo "✅ Created $name/.env"
        else
            echo "⏭️  $name/.env already exists"
        fi
    else
        echo "⚠️  No .env.example found for $name"
    fi
}

# Setup .env for each MCP server
setup_env "MySQL" "MySQL"
setup_env "Jira" "Jira"
setup_env "GitHub" "GitHub"
setup_env "CodeReview" "CodeReview"
setup_env "Atlassian" "Atlassian"
setup_env "CloudWatch" "CloudWatch"
setup_env "AzureAD" "AzureAD"
setup_env "Kafdrop" "Kafdrop"

echo ""

# =============================================================================
# 8. Unregister old servers and register all MCP servers
# =============================================================================
echo "📝 Registering MCP servers with Claude Code..."
echo ""

# Unregister any existing servers first (clean slate)
echo "🧹 Cleaning up old registrations..."
bash "$MCP_DIR/scripts/unregister-all.sh"

echo ""
echo "➕ Registering all MCP servers..."
bash "$MCP_DIR/scripts/register-all.sh"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. 🔐 Configure credentials in .env files:"
echo "   - MySQL/.env (database credentials)"
echo "   - Jira/.env (Jira API token from https://id.atlassian.com/manage-profile/security/api-tokens)"
echo "   - CloudWatch/.env (AWS credentials)"
echo "   - CodeReview/.env (GitHub repo + Jira URL)"
echo "   - Atlassian/.env (Jira credentials)"
echo "   - AzureAD/.env (Azure AD client ID)"
echo "   - Kafdrop/.env (Kafdrop URL)"
echo ""
echo "2. 🔑 Authenticate CLIs (if not already done):"
echo "   - GitHub: gh auth login"
echo "   - Atlassian: acli jira auth login --url https://your-domain.atlassian.net"
echo "   - AWS: aws configure (or use SSO)"
echo ""
echo "3. ✅ Verify installation:"
echo "   claude mcp list"
echo ""
echo "💡 Tip: To recreate .env files, delete them and run 'npm run setup' again"
echo ""
