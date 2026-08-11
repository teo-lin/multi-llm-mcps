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
claude mcp add jira --scope user -- npx --yes @teolin/mcp-jira
gemini mcp add jira npx --yes @teolin/mcp-jira
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add jira --scope user --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-jira
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-jira
claude mcp add jira --scope user -- jira-mcp
gemini mcp add jira jira-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-jira
claude mcp add jira --scope project -- node ./node_modules/@teolin/mcp-jira/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Jira
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add jira --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-jira` for `jira-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "jira": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-jira"],
      "env": { "JIRA_BASE_URL": "https://your-domain.atlassian.net" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add jira --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-jira
```

```toml
[mcp_servers.jira]
command = "npx"
args = ["--yes", "@teolin/mcp-jira"]

[mcp_servers.jira.env]
JIRA_BASE_URL = "https://your-domain.atlassian.net"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add jira -- npx --yes @teolin/mcp-jira
```

```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-jira"],
      "env": { "JIRA_BASE_URL": "https://your-domain.atlassian.net" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  jira:
    type: stdio
    name: jira
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-jira"]
    envs: { JIRA_BASE_URL: "https://your-domain.atlassian.net" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove jira --scope user
gemini mcp remove jira
```

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
