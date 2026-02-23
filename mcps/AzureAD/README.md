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

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add azuread --scope user -- npx --yes @teolin/mcp-azure-ad
gemini mcp add azuread npx --yes @teolin/mcp-azure-ad

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-azure-ad
claude mcp add azuread --scope user -- azuread-mcp
gemini mcp add azuread azuread-mcp

# Option 3: Local project
npm install @teolin/mcp-azure-ad
claude mcp add azuread --scope project -- node ./node_modules/@teolin/mcp-azure-ad/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
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