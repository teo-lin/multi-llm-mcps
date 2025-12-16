# Doctari Jira MCP

Model Context Protocol server for integrating with Doctari's Jira instance.

## Features

- **Ticket Details**: Get comprehensive information about specific Jira tickets
- **JQL Search**: Search tickets using Jira Query Language
- **Board Integration**: Access sprint boards and PTLS bug boards
- **Team Filtering**: Filter PTLS bugs by team (with Absences team shortcut)
- **Team Management**: Validate and list available team names
- **Environment Variables**: Automatic loading of .env configuration

## Prerequisites

- Node.js >=25.2.1
- Jira instance URL and API credentials

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g jira-mcp-server
```

### Option 2: Install locally

```bash
npm install jira-mcp-server
```

### Option 3: Use with npx (no installation)

```bash
npx -y jira-mcp-server
```

## Setup

1. **Install dependencies** (for development):
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Jira credentials
   ```

## Configuration

### Environment Variables

- `JIRA_BASE_URL`: Your Jira instance URL (e.g., https://your-domain.atlassian.net)
- `JIRA_EMAIL`: Your Atlassian account email
- `JIRA_API_TOKEN`: Your Atlassian API token ([Create one here](https://id.atlassian.com/manage-profile/security/api-tokens))

### Board IDs (Optional)
- `JIRA_TEAM_BOARD_ID`: Sprint board ID (default: 114)
- `JIRA_BUGS_BOARD_ID`: Bugs board ID (default: 155)

## Usage

### Running as a standalone server

```bash
# If installed globally
jira-mcp

# If installed locally
npx jira-mcp-server

# Or using npm start (for development)
npm start
```

## Integration with Claude Code

Claude Code supports three scopes for MCP server configuration:

- **User scope** (`~/.claude.json`): Available across all projects
- **Local scope** (`~/.claude.json`): Project-specific, private to you (default)
- **Project scope** (`.mcp.json` in project root): Team-shared, committed to git

### Quick Setup with CLI (Recommended)

```bash
# User scope (available in all projects)
claude mcp add jira --scope user

# Project scope (shared with team via git)
claude mcp add jira --scope project
```

### Manual Configuration

#### Using npx (Recommended - no installation needed)

Add to `.mcp.json` (project scope) or `~/.claude.json` (user scope):

```json
{
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "jira-mcp-server"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

#### Using global installation

```json
{
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "jira-mcp",
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

#### Using local installation

```json
{
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "node",
      "args": [
        "./node_modules/jira-mcp-server/src/index.js"
      ],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools

1. **`get_ticket_details(ticket_key)`**
   - Get detailed info about a specific ticket (e.g., PAB-1234)

2. **`search_tickets_jql(jql, max_results?)`**
   - Search tickets using JQL queries

3. **`get_board_issues(board_id, sprint_id?)`**
   - Get issues from sprint boards

4. **`get_ptls_board_bugs(team_name?)`**
   - Get PTLS bugs, optionally filtered by team

5. **`get_absences_bugs()`**
   - Shortcut for Absences team bugs

6. **`get_team_names()`**
   - List available team names

## Example Usage

```javascript
// In Claude Code conversation:
// "Get me details for ticket PAB-1234"
// "Show me all bugs assigned to the Absences team"
// "What tickets are in the current sprint for board 114?"
```

## Development

```bash
# Start server
npm start

# Test
npm test
```

## Configuration Tips

- Find your board IDs from the Jira board URL: `https://your-domain.atlassian.net/jira/software/projects/PROJECT/boards/{BOARD_ID}`
- Board IDs can be configured in `.env` as `JIRA_TEAM_BOARD_ID` and `JIRA_BUGS_BOARD_ID`

## Requirements

- Node.js >=25.2.1
- Jira instance with API access
- Published on npm: [jira-mcp-server](https://www.npmjs.com/package/jira-mcp-server)

## License

MIT