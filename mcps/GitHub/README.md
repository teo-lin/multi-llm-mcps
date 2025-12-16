# GitHub MCP Server

Model Context Protocol server for GitHub operations using GitHub CLI (`gh`).

## Features

- **PR Information**: Fetch pull request details, diffs, and metadata
- **Repository Context**: Extract and parse GitHub PR identifiers
- **CLI Integration**: Uses GitHub CLI for seamless authentication

## Prerequisites

- Node.js >=25.2.1
- GitHub CLI (`gh`) installed and authenticated

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g @teolin/mcp-github
```

### Option 2: Install locally

```bash
npm install @teolin/mcp-github
```

### Option 3: Use with npx (no installation)

```bash
npx -y @teolin/mcp-github
```

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

### 2. Authenticate with GitHub CLI

```bash
gh auth login
```

## Usage

### Running as a standalone server

```bash
# If installed globally
mcp-github

# If installed locally
npx @teolin/mcp-github

# Or using npm start (for development)
npm start
```

### Running tests

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

Claude Code supports three scopes for MCP server configuration:

- **User scope** (`~/.claude.json`): Available across all projects
- **Local scope** (`~/.claude.json`): Project-specific, private to you (default)
- **Project scope** (`.mcp.json` in project root): Team-shared, committed to git

### Quick Setup with CLI (Recommended)

```bash
# User scope (available in all projects)
claude mcp add github --scope user

# Project scope (shared with team via git)
claude mcp add github --scope project
```

### Manual Configuration

#### Using npx (Recommended - no installation needed)

Add to `.mcp.json` (project scope) or `~/.claude.json` (user scope):

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@teolin/mcp-github"]
    }
  }
}
```

#### Using global installation

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "mcp-github"
    }
  }
}
```

#### Using local installation

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "node",
      "args": [
        "./node_modules/@teolin/mcp-github/src/index.js"
      ]
    }
  }
}
```

## Requirements

- Node.js >=25.2.1
- GitHub CLI (`gh`) authenticated
- Network access to GitHub
- Published on npm: [@teolin/mcp-github](https://www.npmjs.com/package/@teolin/mcp-github)

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
