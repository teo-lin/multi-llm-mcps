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

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-github`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-github`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add github --scope user -- npx --yes @teolin/mcp-github
gemini mcp add github npx --yes @teolin/mcp-github
codex  mcp add github -- npx --yes @teolin/mcp-github
devin  mcp add github --scope user -- npx --yes @teolin/mcp-github

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add github --scope user -- mcp-github
gemini mcp add github mcp-github
codex  mcp add github -- mcp-github
devin  mcp add github --scope user -- mcp-github

# local setup (npm, one project): point at the installed file
claude mcp add github --scope project -- node ./node_modules/@teolin/mcp-github/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/GitHub:
claude mcp add github --scope user -- "$PWD/start-mcp.sh"
gemini mcp add github --scope user "$PWD/start-mcp.sh"
codex  mcp add github -- "$PWD/start-mcp.sh"
devin  mcp add github --scope user -- "$PWD/start-mcp.sh"
```

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove github --scope user
gemini mcp remove github --scope user
codex  mcp remove github
devin  mcp remove github --scope user
```

`claude mcp get github`, `codex mcp get github` and `devin mcp get github` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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

