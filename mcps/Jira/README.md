# Doctari Jira MCP

Model Context Protocol server for integrating with Doctari's Jira instance.

## Features

- **Dual Authentication**: Supports both OAuth (acli) and Basic Auth (API token) with automatic fallback
- **Ticket Details**: Get comprehensive information about specific Jira tickets
- **JQL Search**: Search tickets using Jira Query Language
- **Board Integration**: Access sprint boards and PTLS bug boards
- **Team Filtering**: Filter PTLS bugs by team (with Absences team shortcut)
- **Team Management**: Validate and list available team names
- **Environment Variables**: Automatic loading of .env configuration
- **Robust Fallback**: Automatically tries multiple auth methods for maximum reliability

## Prerequisites

- Node.js >=18.0.0
- Jira instance URL and API credentials

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add jira -s user -- npx -y @teolin/mcp-jira

# Or Project scope (shared with team via git)
claude mcp add jira -s project -- npx -y @teolin/mcp-jira
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx -y @teolin/mcp-jira` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/mcp-jira

# Either User scope (available in all projects)
claude mcp add jira -s user -- jira-mcp

# Or Project scope (shared with team via git)
claude mcp add jira -s project -- jira-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `jira-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/mcp-jira

# Either User scope (available in all projects)
claude mcp add jira -s user -- node ./node_modules/@teolin/mcp-jira/src/index.js

# Or Project scope (shared with team via git)
claude mcp add jira -s project -- node ./node_modules/@teolin/mcp-jira/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-jira/src/index.js` on start)

---

## Configuration

### Environment Variables

#### Required
- `JIRA_BASE_URL`: Your Jira instance URL (e.g., https://your-domain.atlassian.net)

#### Authentication (at least one method required)
- `JIRA_EMAIL`: Your Atlassian account email (for basic auth)
- `JIRA_API_TOKEN`: Your Atlassian API token ([Create one here](https://id.atlassian.com/manage-profile/security/api-tokens)) (for basic auth)
- `JIRA_SITE`: Your Jira site domain (e.g., your-domain.atlassian.net) (for OAuth via acli)

#### Authentication Strategy (Optional)
- `JIRA_AUTH_STRATEGY`: Authentication method preference (default: 'auto')
  - `'auto'`: Try OAuth (acli) first, fallback to Basic Auth (API token)
  - `'oauth'`: Use OAuth (acli) only
  - `'basic'`: Use Basic Auth (API token) only

### Board IDs (Optional)
- `JIRA_TEAM_BOARD_ID`: Sprint board ID (default: 114)
- `JIRA_BUGS_BOARD_ID`: Bugs board ID (default: 155)

## Authentication Methods

This MCP supports two authentication methods with automatic fallback:

### 1. OAuth via Atlassian CLI (Recommended)
- Uses the Atlassian CLI (`acli`) for OAuth authentication
- More secure with broader permissions
- Requires `acli` to be installed and authenticated
- Set `JIRA_SITE` in your `.env` file

**Setup:**
```bash
# Install acli (if not already installed)
npm install -g @atlassian/forge-cli

# Authenticate
acli jira auth login --site your-domain.atlassian.net
```

### 2. Basic Auth with API Token
- Uses email + API token for authentication
- Works without acli installed
- May have limited permissions depending on token scope
- Set `JIRA_EMAIL` and `JIRA_API_TOKEN` in your `.env` file

**Setup:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Add to your `.env` file

### Automatic Fallback

By default (`JIRA_AUTH_STRATEGY='auto'`), the MCP will:
1. Try OAuth (acli) first if available
2. Automatically fallback to Basic Auth if OAuth fails
3. Provide detailed error messages if both methods fail

This ensures maximum reliability across different environments.

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

## Usage Examples

### Example 1: Get ticket details
```javascript
// In Claude Code:
"Get details for PAB-1234"
// Fetches full ticket info including description and acceptance criteria
```

### Example 2: Search tickets with JQL
```javascript
// In Claude Code:
"Find all bugs assigned to me: assignee = currentUser() AND type = Bug"
// Uses JQL to search tickets
```

### Example 3: Get sprint issues
```javascript
// In Claude Code:
"Show me issues in sprint board 114"
// Gets all issues from the specified board
```

### Example 4: Get team bugs
```javascript
// In Claude Code:
"Show me Absences team bugs from the PTLS board"
// Uses get_absences_bugs or get_ptls_board_bugs
```

## Requirements

- Node.js >=18.0.0
- Jira instance with API access
- Published on npm: [@teolin/mcp-jira](https://www.npmjs.com/package/@teolin/mcp-jira)

## License

MIT