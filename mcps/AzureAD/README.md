# Azure AD MCP Server

## Features

Model Context Protocol (MCP) server for Azure Active Directory authentication using OAuth 2.0 device code flow.

- **Device Code Flow**: Interactive authentication for CLI/headless environments
- **Token Caching**: Automatically caches and reuses access tokens
- **Authenticated Requests**: Make HTTP requests with Azure AD Bearer tokens
- **Token Management**: Check auth status and clear cached tokens

## Prerequisites

- Node.js >=18.0.0
- Azure AD Application Registration
- Internet connection for authentication

```bash
# 1. Register application in Azure Portal
# - Go to Azure AD > App registrations > New registration
# - Name: Your application name
# - Supported account types: Choose appropriate option
# - Redirect URI: Public client/native, use http://localhost
# - Note the Application (client) ID
# - Go to Authentication > Advanced settings
# - Enable "Allow public client flows"

# 2. Setup environment
cp .env.example .env
# Add:
#   AZURE_CLIENT_ID=your-client-id
#   AZURE_AUTHORITY=https://login.microsoftonline.com/common
#   AZURE_SCOPES=https://graph.microsoft.com/.default

# Done! MCP will handle device code flow authentication
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
claude mcp add azuread --scope user -- npx --yes @teolin/mcp-azure-ad
gemini mcp add azuread npx --yes @teolin/mcp-azure-ad
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add azuread --scope user --env AZURE_CLIENT_ID=your-client-id -- npx --yes @teolin/mcp-azure-ad
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-azure-ad
claude mcp add azuread --scope user -- azuread-mcp
gemini mcp add azuread azuread-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-azure-ad
claude mcp add azuread --scope project -- node ./node_modules/@teolin/mcp-azure-ad/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/AzureAD
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add azuread --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-azure-ad` for `azuread-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "azuread": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-azure-ad"],
      "env": { "AZURE_CLIENT_ID": "your-client-id" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add azuread --env AZURE_CLIENT_ID=your-client-id -- npx --yes @teolin/mcp-azure-ad
```

```toml
[mcp_servers.azuread]
command = "npx"
args = ["--yes", "@teolin/mcp-azure-ad"]

[mcp_servers.azuread.env]
AZURE_CLIENT_ID = "your-client-id"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add azuread -- npx --yes @teolin/mcp-azure-ad
```

```json
{
  "mcpServers": {
    "azuread": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-azure-ad"],
      "env": { "AZURE_CLIENT_ID": "your-client-id" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  azuread:
    type: stdio
    name: azuread
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-azure-ad"]
    envs: { AZURE_CLIENT_ID: "your-client-id" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove azuread --scope user
gemini mcp remove azuread
```

---

## Available Tools

### 1. authenticate
Authenticate with Azure AD using device code flow. Prompts you to visit a URL and enter a code.

### 2. get_access_token
Get the current access token. Triggers authentication if no valid token exists.

### 3. check_auth_status
Check if currently authenticated and view token expiration details.

### 4. clear_token_cache
Clear the cached access token to force re-authentication. Access tokens are cached automatically and reused until expiration (~1 hour).

### 5. make_authenticated_request
Make an HTTP request with Azure AD authentication.

**Parameters:**
- `url` (string, required): URL to request
- `method` (string): HTTP method (GET, POST, PUT, DELETE, PATCH) - default: GET
- `headers` (object): Additional headers
- `body` (object): Request body for POST/PUT/PATCH

## Usage Examples

### Example 1: Authenticate and get profile
```javascript
// In Claude Code:
"Authenticate with Azure AD and get my profile"
// Triggers device code flow, then calls Microsoft Graph API
```

### Example 2: Check authentication status
```javascript
// In Claude Code:
"Am I authenticated with Azure AD?"
// Shows token status and expiration
```

### Example 3: Make authenticated request
```javascript
// In Claude Code:
"Get my Azure AD user info"
// Uses: make_authenticated_request with https://graph.microsoft.com/v1.0/me
```

### Example 4: Clear cached token
```javascript
// In Claude Code:
"Clear my Azure AD authentication cache"
// Removes cached token, requires re-authentication
```