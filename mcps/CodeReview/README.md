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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/code-review-agent`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/code-review-agent`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add codereview --scope user -- npx --yes @teolin/code-review-agent
gemini mcp add codereview npx --yes @teolin/code-review-agent
codex  mcp add codereview -- npx --yes @teolin/code-review-agent
devin  mcp add codereview --scope user -- npx --yes @teolin/code-review-agent

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add codereview --scope user -- codereview-mcp
gemini mcp add codereview codereview-mcp
codex  mcp add codereview -- codereview-mcp
devin  mcp add codereview --scope user -- codereview-mcp

# local setup (npm, one project): point at the installed file
claude mcp add codereview --scope project -- node ./node_modules/@teolin/code-review-agent/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/CodeReview:
claude mcp add codereview --scope user -- "$PWD/start-mcp.sh"
gemini mcp add codereview --scope user "$PWD/start-mcp.sh"
codex  mcp add codereview -- "$PWD/start-mcp.sh"
devin  mcp add codereview --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add codereview --scope user --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/code-review-agent
gemini mcp add codereview --scope user -e JIRA_BASE_URL=https://your-domain.atlassian.net npx --yes @teolin/code-review-agent
codex  mcp add codereview --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/code-review-agent
devin  mcp add codereview --scope user -e JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/code-review-agent
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove codereview --scope user
gemini mcp remove codereview --scope user
codex  mcp remove codereview
devin  mcp remove codereview --scope user
```

`claude mcp get codereview`, `codex mcp get codereview` and `devin mcp get codereview` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
