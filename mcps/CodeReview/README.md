# Code Review MCP Server

## Features

Automated code review server that integrates GitHub PRs with Jira tickets for comprehensive code review automation.

- **GitHub PR Integration**: Fetches PR diffs and metadata
- **Jira Integration**: Retrieves requirements and acceptance criteria via Atlassian CLI
- **Test Execution**: Pulls branch locally and runs tests
- **Lint Checking**: Runs linting to ensure code quality
- **AI-Powered Analysis**: Generates review comments with file:line references
- **Formatted Output**: Clean markdown report with all findings

## Prerequisites

- Node.js >=25.2.1
- GitHub CLI (`gh`) installed and authenticated
- Atlassian CLI (`acli`) installed and authenticated

```bash
# Authenticate GitHub CLI
gh auth login

# Authenticate Atlassian CLI
acli auth login --url https://your-domain.atlassian.net

# Verify both are working
gh auth status
acli auth list
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
claude mcp add codereview --scope user -- npx --yes @teolin/code-review-agent
gemini mcp add codereview npx --yes @teolin/code-review-agent
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add codereview --scope user --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/code-review-agent
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/code-review-agent
claude mcp add codereview --scope user -- codereview-mcp
gemini mcp add codereview codereview-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/code-review-agent
claude mcp add codereview --scope project -- node ./node_modules/@teolin/code-review-agent/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/CodeReview
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add codereview --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/code-review-agent` for `codereview-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "codereview": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/code-review-agent"],
      "env": { "JIRA_BASE_URL": "https://your-domain.atlassian.net" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add codereview --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/code-review-agent
```

```toml
[mcp_servers.codereview]
command = "npx"
args = ["--yes", "@teolin/code-review-agent"]

[mcp_servers.codereview.env]
JIRA_BASE_URL = "https://your-domain.atlassian.net"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add codereview -- npx --yes @teolin/code-review-agent
```

```json
{
  "mcpServers": {
    "codereview": {
      "command": "npx",
      "args": ["--yes", "@teolin/code-review-agent"],
      "env": { "JIRA_BASE_URL": "https://your-domain.atlassian.net" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  codereview:
    type: stdio
    name: codereview
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/code-review-agent"]
    envs: { JIRA_BASE_URL: "https://your-domain.atlassian.net" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove codereview --scope user
gemini mcp remove codereview
```

---

## Available Tools

### codereview
Automated code review tool that analyzes GitHub PRs, runs tests and linting, fetches Jira requirements, and generates comprehensive review reports.

**Workflow:**
1. Extracts PR diff and metadata from GitHub
2. Finds associated Jira ticket (from branch name/PR title/body)
3. Gets ticket details via Atlassian CLI
4. Checks out PR branch and runs `npm run test`
5. Runs `npm run lint` for code quality
6. Scans for console.log, TODO/FIXME, TypeScript `any`, security issues, missing error handling
7. Generates formatted markdown review report

**Supported patterns:**
- Branch naming: `feat/PAB-123-description`, `fix/ABC-456`
- PR titles: `[PAB-123] Add feature`
- PR descriptions: References to Jira tickets

## Usage Examples

### Example 1: Review current PR
```javascript
// In Claude Code (from a git repository):
"Review PR 123"
// Fetches PR, runs tests & lint, analyzes code, generates review
```

### Example 2: Review specific PR by number
```javascript
// In Claude Code:
"Review PR 456"
// Full code review with Jira integration
```

### Example 3: Quick code quality check
```javascript
// In Claude Code:
"Check code quality for PR 789"
// Runs lint and test suite, reports results
```

### Example 4: Review in specific directory
```javascript
// In Claude Code:
"Review PR 101 in /path/to/repo"
// Explicit path to repository
```
