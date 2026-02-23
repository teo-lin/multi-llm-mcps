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

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add jira --scope user -- npx --yes @teolin/mcp-jira
gemini mcp add jira npx --yes @teolin/mcp-jira

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-jira
claude mcp add jira --scope user -- jira-mcp
gemini mcp add jira jira-mcp

# Option 3: Local project
npm install @teolin/mcp-jira
claude mcp add jira --scope project -- node ./node_modules/@teolin/mcp-jira/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
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
