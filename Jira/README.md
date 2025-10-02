# Doctari Jira MCP

Model Context Protocol server for integrating with Doctari's Jira instance.

## Features

- **Ticket Details**: Get comprehensive information about specific Jira tickets
- **JQL Search**: Search tickets using Jira Query Language
- **Board Integration**: Access sprint boards and PTLS bug boards
- **Team Filtering**: Filter PTLS bugs by team (with Absences team shortcut)
- **Team Management**: Validate and list available team names
- **Environment Variables**: Automatic loading of .env configuration

## Installation

1. **Clone or navigate to the project**:
   ```bash
   cd /Users/teolin/_WORK/_ALL/_MCP/Jira
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Jira credentials
   ```

## Configuration

### Environment Variables

- `JIRA_BASE_URL`: Your Jira instance URL (default: https://doctari.atlassian.net)
- `JIRA_EMAIL`: Your Atlassian account email
- `JIRA_API_TOKEN`: Your Atlassian API token ([Create one here](https://id.atlassian.com/manage-profile/security/api-tokens))

### Board IDs (Optional)
- `JIRA_TEAM_BOARD_ID`: Sprint board ID (default: 114)
- `JIRA_BUGS_BOARD_ID`: Bugs board ID (default: 155)

## Usage with Claude Code

### Run the server:

```bash
npm start
# or
./start-mcp.sh
```


### Available Tools

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

## Board Information

- **PAB Sprint Board**: https://doctari.atlassian.net/jira/software/projects/PAB/boards/114
- **PTLS Bugs Board**: https://doctari.atlassian.net/jira/software/projects/PTLSNEW/boards/155