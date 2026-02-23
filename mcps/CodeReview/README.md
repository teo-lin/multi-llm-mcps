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

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add codereview --scope user -- npx --yes @teolin/code-review-agent
gemini mcp add codereview npx --yes @teolin/code-review-agent

# Option 2: Global install (recommended)
npm install --global @teolin/code-review-agent
claude mcp add codereview --scope user -- codereview-mcp
gemini mcp add codereview codereview-mcp

# Option 3: Local project
npm install @teolin/code-review-agent
claude mcp add codereview --scope project -- node ./node_modules/@teolin/code-review-agent/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
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
