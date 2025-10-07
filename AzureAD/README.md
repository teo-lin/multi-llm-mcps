# Azure AD MCP Server

Model Context Protocol (MCP) server for Azure Active Directory authentication using OAuth 2.0 device code flow.

## Features

- **Device Code Flow**: Interactive authentication for CLI/headless environments
- **Token Caching**: Automatically caches and reuses access tokens
- **Authenticated Requests**: Make HTTP requests with Azure AD Bearer tokens
- **Token Management**: Check auth status and clear cached tokens

## Prerequisites

- Node.js 24.9.0
- Azure AD Application Registration
- Internet connection for authentication

## Setup

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

### 2. Configure Environment

```bash
npm install
cp .env.example .env
```

Edit `.env` and set:
- `AZURE_CLIENT_ID`: Your application's client ID from Azure Portal
- `AZURE_AUTHORITY`: Authority URL (use `https://login.microsoftonline.com/common` for multi-tenant)
- `AZURE_SCOPES`: Required scopes (e.g., `https://graph.microsoft.com/.default`)

## Usage

### Starting the Server

```bash
npm start
```

### Running Tests

```bash
npm test
```

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

## License

MIT
