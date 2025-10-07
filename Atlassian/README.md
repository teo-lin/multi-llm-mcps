# Atlassian MCP Server

Model Context Protocol server for Atlassian Jira operations using the Atlassian CLI (`acli`).

## Features

- **Jira Ticket Information**: Retrieve ticket details including summary, description, and acceptance criteria
- **Ticket Extraction**: Automatically extract Jira ticket keys from text (PR titles, branch names, etc.)
- **Browser Integration**: Opens tickets in your default browser for quick access
- **Auto-Authentication**: Attempts to authenticate using credentials from `.env` file
- **CLI Integration**: Uses Atlassian CLI for seamless Jira access

## Prerequisites

- Node.js 24.9.0
- Atlassian CLI (`acli`) installed and authenticated
- Jira instance URL

## Setup

### 1. Install Atlassian CLI

```bash
# Install via npm
npm install -g @atlassian/forge-cli

# Or download from:
# https://developer.atlassian.com/console/install/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `JIRA_BASE_URL`: Your Jira instance URL (e.g., `https://your-domain.atlassian.net`)
- `JIRA_SITE`: Your Jira site domain (e.g., `your-domain.atlassian.net`)
- `JIRA_EMAIL`: Your Atlassian account email
- `JIRA_API_TOKEN`: Your Atlassian API token ([Create one here](https://id.atlassian.com/manage-profile/security/api-tokens))

### 4. Authenticate (if not using auto-auth)

```bash
acli jira auth login --url https://your-domain.atlassian.net
```

## Usage

### Starting the Server

```bash
npm start
# or
./start-mcp.sh
```

### Running Tests

```bash
npm test
```

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

## Integration with Claude Code

```bash
# Add to Claude Code
cd /path/to/_MCP
./scripts/register-all.sh

# Or register individually
claude mcp add atlassian /path/to/_MCP/Atlassian/start-mcp.sh
```

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

## Requirements

- Node.js 24.9.0
- Atlassian CLI authenticated
- Network access to Jira instance

## License

MIT
