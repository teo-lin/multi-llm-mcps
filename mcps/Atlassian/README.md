# Atlassian MCP Server

Model Context Protocol server for Atlassian Jira operations using the Atlassian CLI (`acli`) running locally, on your machine, completely private.

## Local vs Remote MCP

This is a **local stdio MCP server** that runs on your machine. For comparison with Atlassian's official solution:

| Feature                  | This MCP (@teolin/mcp-atlassian)                    | Atlassian Remote MCP Server          |
| ------------------------ | --------------------------------------------------- | ------------------------------------ |
| **Type**           | Local stdio server                                  | Remote HTTP server (cloud-hosted)    |
| **Authentication** | OAuth (acli) + Basic Auth (API token) with fallback | OAuth                                |
| **Scope**          | Jira only                                           | Jira + Confluence                    |
| **Setup**          | Install npm package, configure auth (flexible)      | OAuth setup via Atlassian portal     |
| **Access**         | Personal (your machine)                             | Team-wide (enterprise)               |
| **Performance**    | Fast (local, no network latency)                    | Network-dependent                    |
| **Features**       | Ticket info, extraction, browser open               | Bulk operations, enterprise security |

**Use this MCP if:** You want a lightweight, local solution for Jira ticket operations
**Use Atlassian's Remote MCP if:** You need enterprise features, Confluence access, or team-wide deployment

## Features

- **Dual Authentication**: Supports both OAuth (acli) and Basic Auth (API token) with automatic fallback
- **Jira Ticket Information**: Retrieve ticket details including summary, description, and acceptance criteria
- **Ticket Extraction**: Automatically extract Jira ticket keys from text (PR titles, branch names, etc.)
- **Browser Integration**: Opens tickets in your default browser for quick access
- **Auto-Authentication**: Attempts to authenticate using credentials from `.env` file
- **CLI Integration**: Uses Atlassian CLI for seamless Jira access
- **Robust Fallback**: Automatically tries multiple auth methods for maximum reliability

## Prerequisites

- Node.js >=18.0.0
- Atlassian CLI (`acli`) installed and authenticated
- Jira instance URL

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add atlassian --scope user -- npx --yes @teolin/mcp-atlassian

# Or Project scope (shared with team via git)
claude mcp add atlassian -s project -- npx --yes @teolin/mcp-atlassian
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx --yes @teolin/mcp-atlassian` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/mcp-atlassian

# Either User scope (available in all projects)
claude mcp add atlassian --scope user -- atlassian-mcp

# Or Project scope (shared with team via git)
claude mcp add atlassian -s project -- atlassian-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `atlassian-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/mcp-atlassian

# Either User scope (available in all projects)
claude mcp add atlassian --scope user -- node ./node_modules/@teolin/mcp-atlassian/src/index.js

# Or Project scope (shared with team via git)
claude mcp add atlassian -s project -- node ./node_modules/@teolin/mcp-atlassian/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-atlassian/src/index.js` on start)

---

## Configuration

### Install Atlassian CLI

```bash
# Install via npm
npm install -g @atlassian/forge-cli

# Or download from:
# https://developer.atlassian.com/console/install/
```

### Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure authentication:

#### Required
- `JIRA_BASE_URL`: Your Jira instance URL (e.g., `https://your-domain.atlassian.net`)

#### Authentication (at least one method required)
- `JIRA_SITE`: Your Jira site domain (e.g., `your-domain.atlassian.net`) (for OAuth via acli)
- `JIRA_EMAIL`: Your Atlassian account email (for basic auth)
- `JIRA_API_TOKEN`: Your Atlassian API token ([Create one here](https://id.atlassian.com/manage-profile/security/api-tokens)) (for basic auth)

#### Authentication Strategy (Optional)
- `JIRA_AUTH_STRATEGY`: Authentication method preference (default: 'auto')
  - `'auto'`: Try OAuth (acli) first, fallback to Basic Auth (API token)
  - `'oauth'`: Use OAuth (acli) only
  - `'basic'`: Use Basic Auth (API token) only

### Authenticate (if not using auto-auth)

```bash
acli jira auth login --url https://your-domain.atlassian.net
```

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

This ensures maximum reliability across different environments and authentication setups.

## Available Tools

### 1. jira_ticket_info

Get detailed information about a Jira ticket.

**Parameters:**

- `ticket_key` (string, required): Jira ticket key (e.g., "PAB-2197")
- `working_directory` (string, optional): Working directory path

**Features:**

- Retrieves ticket details via Atlassian CLI
- Extracts acceptance criteria from ticket description
- Automatically opens ticket in browser
- Falls back gracefully if CLI fails

### 2. jira_extract_ticket_from_text

Extract Jira ticket key from text.

**Parameters:**

- `text` (string, required): Text to search for ticket key

**Examples:**

- Branch name: `feat/PAB-123-description` → `PAB-123`
- PR title: `[ABC-456] Fix bug` → `ABC-456`

### 3. jira_open_ticket

Open a Jira ticket in the default browser.

**Parameters:**

- `ticket_key` (string, required): Jira ticket key to open

### 4. jira_auth_status

Check Atlassian CLI authentication status.

## Auto-Authentication

The server attempts to authenticate automatically using `.env` credentials if the Atlassian CLI is not already authenticated. This provides a seamless experience without manual CLI authentication.

## Ticket Key Pattern

The server recognizes Jira ticket keys in the format: `[A-Z]+-\d+`

Examples: `PAB-123`, `PROJ-456`, `ABC-789`

## Troubleshooting

### Atlassian CLI not authenticated

```bash
acli jira auth status
# If not authenticated:
acli jira auth login --url https://your-domain.atlassian.net
```

### Auto-authentication fails

- Verify `.env` file contains correct credentials
- Check that `JIRA_SITE`, `JIRA_EMAIL`, and `JIRA_API_TOKEN` are set
- Try manual authentication with `acli jira auth login`

### Browser doesn't open

- Check that `JIRA_BASE_URL` is correctly set in `.env`
- Ensure `open` command is available on your system

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-atlassian" → Run workflow
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
   JIRA_BASE_URL=https://your-instance.atlassian.net node src/index.js
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
   npx --yes @teolin/mcp-atlassian

   # Or install globally and test
   npm install -g @teolin/mcp-atlassian
   atlassian-mcp
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
- https://www.npmjs.com/package/@teolin/mcp-atlassian

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-atlassian
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Usage Examples

### Example 1: Get ticket details
```javascript
// In Claude Code conversation:
"Get details for PAB-2197"
// Automatically extracts ticket key and retrieves info
```

### Example 2: Extract ticket from branch name
```javascript
// In Claude Code:
"What ticket is this branch for: feat/PAB-123-add-authentication"
// Returns: PAB-123 with full ticket details
```

### Example 3: Check auth status
```javascript
// In Claude Code:
"Check my Jira authentication status"
// Shows current acli login status
```

### Example 4: Open ticket in browser
```javascript
// In Claude Code:
"Open PAB-456 in my browser"
// Launches default browser with the ticket
```

## Requirements

- Node.js >=18.0.0
- Atlassian CLI (`acli`) authenticated
- Network access to Jira instance
- Published on npm: [@teolin/mcp-atlassian](https://www.npmjs.com/package/@teolin/mcp-atlassian)

## License

MIT
