# GitHub MCP Server

## Features

Model Context Protocol server for GitHub operations using GitHub CLI (`gh`).

- **PR Information**: Fetch pull request details, diffs, and metadata
- **Repository Context**: Extract and parse GitHub PR identifiers
- **CLI Integration**: Uses GitHub CLI for seamless authentication

This is a **local stdio MCP server** that runs on your machine and consumes fewer tokens and less context. For comparison with GitHub's official solution:

| Feature    | This Server             | Official MCP           |
|------------|-------------------------|------------------------|
| **Auth**   | GitHub CLI (`gh`)       | GitHub token           |
| **API**    | CLI wrapper             | REST/GraphQL           |
| **Tools**  | PR info, diff, auth     | Comprehensive API      |
| **Setup**  | Requires `gh` install   | Token-based            |
| **Tokens** | 318                     | 5100                   |

## Prerequisites

- Node.js >=18.0.0
- GitHub CLI (`gh`) installed and authenticated

```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate with GitHub CLI
gh auth login
```

## Setup

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add github --scope user -- npx --yes @teolin/mcp-github
gemini mcp add github npx --yes @teolin/mcp-github

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-github
claude mcp add github --scope user -- mcp-github
gemini mcp add github mcp-github

# Option 3: Local project
npm install @teolin/mcp-github
claude mcp add github --scope project -- node ./node_modules/@teolin/mcp-github/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
claude mcp remove github --scope user
gemini mcp remove github
```

---

## Available Tools

The GitHub MCP provides tools for interacting with GitHub pull requests and repositories through the GitHub CLI.

### PR Identifier Formats

The server supports multiple PR identifier formats:
- **PR number**: `123`
- **PR with hash**: `#123`
- **PR URL**: `https://github.com/owner/repo/pull/123`
- **Branch name**: `feat/PAB-123-feature-name`

## Usage Examples

### Example 1: Get PR details
```javascript
// In Claude Code (from a git repository):
"Get details for PR 123"
// Fetches PR metadata and diff
```

### Example 2: Get PR from URL
```javascript
// In Claude Code:
"Analyze PR https://github.com/owner/repo/pull/456"
// Extracts PR number and fetches details
```

### Example 3: Get PR diff
```javascript
// In Claude Code:
"Show me the diff for PR #789"
// Gets full diff of all changes
```

### Example 4: Get PR from branch
```javascript
// In Claude Code:
"Get PR for branch feat/PAB-123-new-feature"
// Finds PR associated with the branch
```

