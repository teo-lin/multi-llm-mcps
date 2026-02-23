# Atlassian MCP Server

## Features

Model Context Protocol server for Atlassian Jira operations using the Atlassian CLI (`acli`) running locally, on your machine, completely private.
- **Dual Authentication**: Supports both OAuth (acli) and Basic Auth (API token) with automatic fallback
- **Jira Ticket Information**: Retrieve ticket details including summary, description, and acceptance criteria
- **Ticket Extraction**: Automatically extract Jira ticket keys from text (PR titles, branch names, etc.)
- **Browser Integration**: Opens tickets in your default browser for quick access
- **Auto-Authentication**: Attempts to authenticate using credentials from `.env` file
- **CLI Integration**: Uses Atlassian CLI for seamless Jira access
- **Robust Fallback**: Automatically tries multiple auth methods for maximum reliability
  
This is a **local stdio MCP server** that runs on your machine and consumes fewer tokens and less context. For comparison with Atlassian's official solution:

| Feature            | This MCP (@teolin/mcp-atlassian)                    | Atlassian Remote MCP Server          |
| ------------------ | --------------------------------------------------- | ------------------------------------ |
| **Type**           | Local stdio server                                  | Remote HTTP server (cloud-hosted)    |
| **Authentication** | OAuth (acli) + Basic Auth (API token) with fallback | OAuth                                |
| **Scope**          | Jira only                                           | Jira + Confluence                    |
| **Setup**          | Install npm package, configure auth (flexible)      | OAuth setup via Atlassian portal     |
| **Access**         | Personal (your machine)                             | Team-wide (enterprise)               |
| **Performance**    | Fast (local, no network latency)                    | Network-dependent                    |
| **Features**       | Ticket info, extraction, browser open               | Bulk operations, enterprise security |

**Use this MCP if:** You want a lightweight, local solution for Jira ticket operations
**Use Atlassian's Remote MCP if:** You need enterprise features, Confluence access, or team-wide deployment

## Prerequisites

- Node.js >=18.0.0
- Atlassian CLI (`acli`) installed and authenticated
- Jira instance URL

```bash
# 1. Install Atlassian CLI
npm install -g @atlassian/forge-cli

# 2. Setup environment
cp .env.example .env
# Add:
#   JIRA_BASE_URL=https://your-domain.atlassian.net
#   JIRA_AUTH_STRATEGY=auto  # auto, oauth, or basic

# Choose one authentication method:
# OAuth (recommended):
#   JIRA_SITE=your-domain.atlassian.net
acli jira auth login --site your-domain.atlassian.net

# OR Basic Auth:
#   JIRA_EMAIL=your-email@example.com
#   JIRA_API_TOKEN=your-api-token

# The MCP automatically tries OAuth first, then falls back to Basic Auth
```

## Setup

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add atlassian --scope user -- npx --yes @teolin/mcp-atlassian
gemini mcp add atlassian npx --yes @teolin/mcp-atlassian

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-atlassian
claude mcp add atlassian --scope user -- atlassian-mcp
gemini mcp add atlassian atlassian-mcp

# Option 3: Local project
npm install @teolin/mcp-atlassian
claude mcp add atlassian --scope project -- node ./node_modules/@teolin/mcp-atlassian/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
claude mcp remove atlassian --scope user
gemini mcp remove atlassian
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



## Ticket Key Pattern

The server recognizes Jira ticket keys in the format: `[A-Z]+-\d+`

Examples: `PAB-123`, `PROJ-456`, `ABC-789`

