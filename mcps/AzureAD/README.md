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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-azure-ad`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-azure-ad`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add azuread --scope user -- npx --yes @teolin/mcp-azure-ad
gemini mcp add azuread npx --yes @teolin/mcp-azure-ad
codex  mcp add azuread -- npx --yes @teolin/mcp-azure-ad
devin  mcp add azuread --scope user -- npx --yes @teolin/mcp-azure-ad

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add azuread --scope user -- azuread-mcp
gemini mcp add azuread azuread-mcp
codex  mcp add azuread -- azuread-mcp
devin  mcp add azuread --scope user -- azuread-mcp

# local setup (npm, one project): point at the installed file
claude mcp add azuread --scope project -- node ./node_modules/@teolin/mcp-azure-ad/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/AzureAD:
claude mcp add azuread --scope user -- "$PWD/start-mcp.sh"
gemini mcp add azuread --scope user "$PWD/start-mcp.sh"
codex  mcp add azuread -- "$PWD/start-mcp.sh"
devin  mcp add azuread --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add azuread --scope user --env AZURE_CLIENT_ID=your-client-id -- npx --yes @teolin/mcp-azure-ad
gemini mcp add azuread --scope user -e AZURE_CLIENT_ID=your-client-id npx --yes @teolin/mcp-azure-ad
codex  mcp add azuread --env AZURE_CLIENT_ID=your-client-id -- npx --yes @teolin/mcp-azure-ad
devin  mcp add azuread --scope user -e AZURE_CLIENT_ID=your-client-id -- npx --yes @teolin/mcp-azure-ad
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove azuread --scope user
gemini mcp remove azuread --scope user
codex  mcp remove azuread
devin  mcp remove azuread --scope user
```

`claude mcp get azuread`, `codex mcp get azuread` and `devin mcp get azuread` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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