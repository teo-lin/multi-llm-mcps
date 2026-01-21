# Azure AD MCP Server

Model Context Protocol (MCP) server for Azure Active Directory authentication using OAuth 2.0 device code flow.

## Features

- **Device Code Flow**: Interactive authentication for CLI/headless environments
- **Token Caching**: Automatically caches and reuses access tokens
- **Authenticated Requests**: Make HTTP requests with Azure AD Bearer tokens
- **Token Management**: Check auth status and clear cached tokens

## Prerequisites

- Node.js >=18.0.0
- Azure AD Application Registration
- Internet connection for authentication

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add azuread -s user -- npx -y @teolin/mcp-azure-ad

# Or Project scope (shared with team via git)
claude mcp add azuread -s project -- npx -y @teolin/mcp-azure-ad
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx -y @teolin/mcp-azure-ad` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/mcp-azure-ad

# Either User scope (available in all projects)
claude mcp add azuread -s user -- azuread-mcp

# Or Project scope (shared with team via git)
claude mcp add azuread -s project -- azuread-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `azuread-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/mcp-azure-ad

# Either User scope (available in all projects)
claude mcp add azuread -s user -- node ./node_modules/@teolin/mcp-azure-ad/src/index.js

# Or Project scope (shared with team via git)
claude mcp add azuread -s project -- node ./node_modules/@teolin/mcp-azure-ad/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-azure-ad/src/index.js` on start)

---

## Configuration

### 1. Register an Application in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: Your application name
   - **Supported account types**: Choose appropriate option
   - **Redirect URI**: Select "Public client/native" and use `http://localhost`
5. After creation, note the **Application (client) ID**
6. Go to **Authentication** > **Advanced settings**
7. Enable "Allow public client flows"

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set:
- `AZURE_CLIENT_ID`: Your application's client ID from Azure Portal
- `AZURE_AUTHORITY`: Authority URL (use `https://login.microsoftonline.com/common` for multi-tenant)
- `AZURE_SCOPES`: Required scopes (e.g., `https://graph.microsoft.com/.default`)

## Available Tools

### 1. authenticate
Authenticate with Azure AD using device code flow. Will prompt you to visit a URL and enter a code.

### 2. get_access_token
Get the current access token. Will trigger authentication if no valid token exists.

### 3. check_auth_status
Check if currently authenticated and view token expiration details.

### 4. clear_token_cache
Clear the cached access token to force re-authentication.

### 5. make_authenticated_request
Make an HTTP request with Azure AD authentication.

**Parameters:**
- `url` (string, required): URL to request
- `method` (string): HTTP method (GET, POST, PUT, DELETE, PATCH) - default: GET
- `headers` (object): Additional headers
- `body` (object): Request body for POST/PUT/PATCH

**Example:**
```json
{
  "url": "https://graph.microsoft.com/v1.0/me",
  "method": "GET"
}
```

## Authentication Flow

1. When authentication is needed, the server displays:
   - A verification URL (e.g., https://microsoft.com/devicelogin)
   - A user code to enter
   - Expiration time

2. Visit the URL in a browser on any device
3. Enter the code shown
4. Complete the authentication (login, MFA, consent)
5. The server receives the access token automatically

## Token Caching

Access tokens are cached in `.token-cache.json` and automatically reused until they expire (typically 1 hour). The cache is stored in the `src` directory.

## Integration with Other MCP Servers

Use this server to authenticate requests to Azure AD-protected APIs:

```javascript
// First authenticate
await mcpClient.call('azuread-server', 'authenticate');

// Make authenticated request
const response = await mcpClient.call('azuread-server', 'make_authenticated_request', {
  url: 'https://your-protected-api.com/endpoint',
  method: 'GET'
});
```

## Troubleshooting

### Authentication fails
- Verify `AZURE_CLIENT_ID` is correct
- Ensure "Allow public client flows" is enabled in Azure Portal
- Check that the required scopes are granted in Azure AD

### Token expired errors
- Run `clear_token_cache` tool to force re-authentication
- Delete `.token-cache.json` manually

### Connection errors
- Ensure internet connectivity
- Check firewall settings
- Verify Azure AD authority URL is accessible

## Security Notes

- Never commit `.env` or `.token-cache.json` to version control
- Access tokens are sensitive - handle with care
- Tokens expire automatically (usually within 1 hour)
- Use appropriate scopes - request only what you need

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-azure-ad" → Run workflow
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
   AZURE_CLIENT_ID=your-client-id AZURE_AUTHORITY=https://login.microsoftonline.com/common AZURE_SCOPES=https://graph.microsoft.com/.default node src/index.js
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
   npx -y @teolin/mcp-azure-ad

   # Or install globally and test
   npm install -g @teolin/mcp-azure-ad
   azuread-mcp
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
- https://www.npmjs.com/package/@teolin/mcp-azure-ad

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-azure-ad
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Usage Examples

### Example 1: Authenticate and make API call
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

### Example 3: Make authenticated request to Graph API
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

## Requirements

- Node.js >=18.0.0
- Azure AD Application Registration
- Published on npm: [@teolin/mcp-azure-ad](https://www.npmjs.com/package/@teolin/mcp-azure-ad)

## License

MIT
