# Jira MCP Server

## Features

Model Context Protocol server for integrating with Jira instances.

- **Dual Authentication**: OAuth (acli) and Basic Auth (API token) with automatic fallback
- **Ticket Details**: Get comprehensive information about specific Jira tickets
- **JQL Search**: Search tickets using Jira Query Language
- **Board Integration**: Access sprint boards and team bug boards
- **Team Filtering**: Filter bugs by team
- **Team Management**: Validate and list available team names

## Prerequisites

- Node.js >=18.0.0
- Jira instance URL and API credentials
- Atlassian CLI (`acli`) for OAuth or API token for Basic Auth

```bash
# Setup environment
cp .env.example .env
# Add:
#   JIRA_BASE_URL=https://your-domain.atlassian.net
#   JIRA_AUTH_STRATEGY=auto  # auto, oauth, or basic

# Choose one authentication method:
# OAuth (recommended):
#   JIRA_SITE=your-domain.atlassian.net
#   acli jira auth login --site your-domain.atlassian.net
# OR Basic Auth:
#   JIRA_EMAIL=your-email@example.com
#   JIRA_API_TOKEN=your-api-token

# Optional board IDs:
#   JIRA_TEAM_BOARD_ID=114
#   JIRA_BUGS_BOARD_ID=155
```

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-jira`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-jira`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add jira --scope user -- npx --yes @teolin/mcp-jira
gemini mcp add jira npx --yes @teolin/mcp-jira
codex  mcp add jira -- npx --yes @teolin/mcp-jira
devin  mcp add jira --scope user -- npx --yes @teolin/mcp-jira

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add jira --scope user -- jira-mcp
gemini mcp add jira jira-mcp
codex  mcp add jira -- jira-mcp
devin  mcp add jira --scope user -- jira-mcp

# local setup (npm, one project): point at the installed file
claude mcp add jira --scope project -- node ./node_modules/@teolin/mcp-jira/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/Jira:
claude mcp add jira --scope user -- "$PWD/start-mcp.sh"
gemini mcp add jira --scope user "$PWD/start-mcp.sh"
codex  mcp add jira -- "$PWD/start-mcp.sh"
devin  mcp add jira --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add jira --scope user --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-jira
gemini mcp add jira --scope user -e JIRA_BASE_URL=https://your-domain.atlassian.net npx --yes @teolin/mcp-jira
codex  mcp add jira --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-jira
devin  mcp add jira --scope user -e JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-jira
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove jira --scope user
gemini mcp remove jira --scope user
codex  mcp remove jira
devin  mcp remove jira --scope user
```

`claude mcp get jira`, `codex mcp get jira` and `devin mcp get jira` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

---

## Available Tools

### 1. get_ticket_details
Get detailed info about a specific ticket (e.g., PAB-1234).

### 2. search_tickets_jql
Search tickets using JQL queries.

### 3. get_board_issues
Get issues from sprint boards.

### 4. get_ptls_board_bugs
Get PTLS bugs, optionally filtered by team.

### 5. get_absences_bugs
Shortcut for Absences team bugs.

### 6. get_team_names
List available team names.

## Usage Examples

### Example 1: Get ticket details
```javascript
// In Claude Code:
"Get me details for ticket PAB-1234"
// Retrieves full ticket information
```

### Example 2: Search with JQL
```javascript
// In Claude Code:
"Show me all bugs assigned to the Absences team"
// Uses: search_tickets_jql with custom filter
```

### Example 3: Get board issues
```javascript
// In Claude Code:
"What tickets are in the current sprint for board 114?"
// Retrieves sprint issues
```

### Example 4: List teams
```javascript
// In Claude Code:
"List all available team names"
// Returns team names for filtering
```
