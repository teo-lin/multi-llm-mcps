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

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-jira" → Run workflow
2. The workflow will automatically:
   - Install dependencies
   - Run the `prepublishOnly` script to make the bin executable
   - Publish to npm with public access

### Manual Publishing

#### Prerequisites

1. You need an npm account: https://www.npmjs.com/signup
2. Login to npm:
   ```bash
   npm login
   ```

#### Publishing Steps

1. **Test the package locally** (optional but recommended):
   ```bash
   # Test that it runs
   node src/index.js --help

   # Or test with environment variables
   JIRA_BASE_URL=https://your-domain.atlassian.net JIRA_EMAIL=your-email@example.com JIRA_API_TOKEN=your-token node src/index.js
   ```

2. **Publish to npm**:
   ```bash
   npm publish
   ```

   This will:
   - Run the `prepublishOnly` script to make the bin executable
   - Only include files specified in the `files` field
   - Publish to npm with public access (configured in `publishConfig`)

3. **Verify the package**:
   ```bash
   # Test with npx (no installation)
   npx -y @teolin/mcp-jira

   # Or install globally and test
   npm install -g @teolin/mcp-jira
   jira-mcp
   ```

#### Updating the Package

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes (2.0.2 -> 2.0.3)
   npm version minor  # for new features (2.0.2 -> 2.1.0)
   npm version major  # for breaking changes (2.0.2 -> 3.0.0)
   ```

2. Publish the new version:
   ```bash
   npm publish
   ```

#### Checking Published Package

View your package on npm:
- https://www.npmjs.com/package/@teolin/mcp-jira

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-jira
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Requirements

- Node.js >=25.2.1
- Jira instance with API access
- Published on npm: [jira-mcp-server](https://www.npmjs.com/package/jira-mcp-server)

## License

MIT