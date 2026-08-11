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
claude mcp add atlassian --scope user -- npx --yes @teolin/mcp-atlassian
gemini mcp add atlassian npx --yes @teolin/mcp-atlassian
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add atlassian --scope user --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-atlassian
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-atlassian
claude mcp add atlassian --scope user -- atlassian-mcp
gemini mcp add atlassian atlassian-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-atlassian
claude mcp add atlassian --scope project -- node ./node_modules/@teolin/mcp-atlassian/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Atlassian
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add atlassian --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-atlassian` for `atlassian-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-atlassian"],
      "env": { "JIRA_BASE_URL": "https://your-domain.atlassian.net" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add atlassian --env JIRA_BASE_URL=https://your-domain.atlassian.net -- npx --yes @teolin/mcp-atlassian
```

```toml
[mcp_servers.atlassian]
command = "npx"
args = ["--yes", "@teolin/mcp-atlassian"]

[mcp_servers.atlassian.env]
JIRA_BASE_URL = "https://your-domain.atlassian.net"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add atlassian -- npx --yes @teolin/mcp-atlassian
```

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-atlassian"],
      "env": { "JIRA_BASE_URL": "https://your-domain.atlassian.net" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  atlassian:
    type: stdio
    name: atlassian
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-atlassian"]
    envs: { JIRA_BASE_URL: "https://your-domain.atlassian.net" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove atlassian --scope user
gemini mcp remove atlassian
```

---

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



## Usage Examples

### Example 1: Read a ticket
```javascript
// In Claude Code:
"What does PAB-2791 say?"
// Uses: jira_ticket_info
```

### Example 2: Pull keys out of text
```javascript
// In Claude Code:
"Which tickets are mentioned in this branch name?"
// Uses: jira_extract_ticket_from_text
```

### Example 3: Open in the browser
```javascript
// In Claude Code:
"Open PAB-2791 in my browser"
// Uses: jira_open_ticket
```

## Ticket Key Pattern

The server recognizes Jira ticket keys in the format: `[A-Z]+-\d+`

Examples: `PAB-123`, `PROJ-456`, `ABC-789`

