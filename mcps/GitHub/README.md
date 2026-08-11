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

## Setup and Usage

Three ways to run this server. Pick one — they all end with the same MCP registered in your agent.

| Method         | What it does                              | Use it when                            |
| -------------- | ----------------------------------------- | -------------------------------------- |
| **npx**        | Downloads and runs on demand, nothing kept | Trying it out, or always want latest    |
| **npm install**| Installs once, runs from disk              | Daily use — fastest start, works offline |
| **clone repo** | Runs your own source copy                  | You want to change the server code       |

### npx

No install. npx fetches the package on first run and caches it, so the first start is slower.

```bash
claude mcp add github --scope user -- npx --yes @teolin/mcp-github
gemini mcp add github npx --yes @teolin/mcp-github
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-github
claude mcp add github --scope user -- mcp-github
gemini mcp add github mcp-github

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-github
claude mcp add github --scope project -- node ./node_modules/@teolin/mcp-github/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/GitHub
npm install
claude mcp add github --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-github` for `mcp-github`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "github": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-github"],
      "env": {},
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add github -- npx --yes @teolin/mcp-github
```

```toml
[mcp_servers.github]
command = "npx"
args = ["--yes", "@teolin/mcp-github"]
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add github -- npx --yes @teolin/mcp-github
```

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-github"],
      "env": {}
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  github:
    type: stdio
    name: github
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-github"]
    envs: {}
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

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

