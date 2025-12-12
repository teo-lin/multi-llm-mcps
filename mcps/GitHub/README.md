# GitHub MCP Server

Model Context Protocol server for GitHub operations using GitHub CLI (`gh`).

## Features

- **PR Information**: Fetch pull request details, diffs, and metadata
- **Repository Context**: Extract and parse GitHub PR identifiers
- **CLI Integration**: Uses GitHub CLI for seamless authentication

## Prerequisites

- Node.js 24.9.0
- GitHub CLI (`gh`) installed and authenticated

## Setup

### 1. Install GitHub CLI

```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 2. Authenticate

```bash
gh auth login
```

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Starting the Server

```bash
npm start
# or
./start-mcp.sh
```

### Running Tests

```bash
npm test
```

## Available Tools

The GitHub MCP provides tools for interacting with GitHub pull requests and repositories through the GitHub CLI.

### PR Identifier Formats

The server supports multiple PR identifier formats:
- **PR number**: `123`
- **PR with hash**: `#123`
- **PR URL**: `https://github.com/owner/repo/pull/123`
- **Branch name**: `feat/PAB-123-feature-name`

## Integration with Claude Code

```bash
# Add to Claude Code
cd /path/to/_MCP
./scripts/register-all.sh

# Or register individually
claude mcp add github /path/to/_MCP/GitHub/start-mcp.sh
```

## Requirements

- Node.js 24.9.0
- GitHub CLI authenticated
- Network access to GitHub

## Troubleshooting

### GitHub CLI not authenticated
```bash
gh auth status
# If not authenticated:
gh auth login
```

### Permission errors
- Ensure you have access to the repository
- Check GitHub CLI permissions: `gh auth refresh -h github.com -s repo`

## License

MIT
