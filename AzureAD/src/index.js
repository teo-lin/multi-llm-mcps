#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as msal from '@azure/msal-node';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AzureADMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'azuread-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.tokenCachePath = path.join(__dirname, '.token-cache.json');
    this.accessToken = null;
    this.tokenExpiry = null;

    // MSAL configuration
    this.msalConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID || '',
        authority: process.env.AZURE_AUTHORITY || 'https://login.microsoftonline.com/common',
      },
    };

    this.scopes = (process.env.AZURE_SCOPES || 'https://graph.microsoft.com/.default').split(',');

    if (!this.msalConfig.auth.clientId) {
      console.error('Warning: AZURE_CLIENT_ID not set. Authentication will fail.');
    }

    this.pca = new msal.PublicClientApplication(this.msalConfig);

    this.loadTokenCache();
    this.setupHandlers();
  }

  loadTokenCache() {
    try {
      if (fs.existsSync(this.tokenCachePath)) {
        const cache = JSON.parse(fs.readFileSync(this.tokenCachePath, 'utf8'));
        if (cache.accessToken && cache.expiry && new Date(cache.expiry) > new Date()) {
          this.accessToken = cache.accessToken;
          this.tokenExpiry = new Date(cache.expiry);
          console.error('✅ Loaded cached access token');
        }
      }
    } catch (error) {
      console.error('Failed to load token cache:', error.message);
    }
  }

  saveTokenCache() {
    try {
      const cache = {
        accessToken: this.accessToken,
        expiry: this.tokenExpiry?.toISOString(),
      };
      fs.writeFileSync(this.tokenCachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error('Failed to save token cache:', error.message);
    }
  }

  async acquireToken() {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry.getTime() - 60000)) {
      return this.accessToken;
    }

    console.error('🔐 Initiating Azure AD device code flow...');

    const deviceCodeRequest = {
      deviceCodeCallback: (response) => {
        console.error('\n' + '='.repeat(60));
        console.error('🔑 AZURE AD AUTHENTICATION REQUIRED');
        console.error('='.repeat(60));
        console.error(`\n📱 Please visit: ${response.verificationUri}`);
        console.error(`🔢 Enter code: ${response.userCode}`);
        console.error(`\n⏰ Code expires in ${Math.floor(response.expiresIn / 60)} minutes`);
        console.error('='.repeat(60) + '\n');
      },
      scopes: this.scopes,
    };

    try {
      const response = await this.pca.acquireTokenByDeviceCode(deviceCodeRequest);
      this.accessToken = response.accessToken;
      this.tokenExpiry = response.expiresOn;
      this.saveTokenCache();
      console.error('✅ Successfully authenticated!');
      return this.accessToken;
    } catch (error) {
      throw new Error(`Azure AD authentication failed: ${error.message}`);
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'authenticate',
          description: 'Authenticate with Azure AD using device code flow',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_access_token',
          description: 'Get the current access token (will trigger authentication if needed)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'check_auth_status',
          description: 'Check if currently authenticated and token validity',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'clear_token_cache',
          description: 'Clear the cached access token',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'make_authenticated_request',
          description: 'Make an HTTP request with Azure AD authentication',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to make the request to',
              },
              method: {
                type: 'string',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                description: 'HTTP method (default: GET)',
              },
              headers: {
                type: 'object',
                description: 'Additional headers to include',
              },
              body: {
                type: 'object',
                description: 'Request body (for POST/PUT/PATCH)',
              },
            },
            required: ['url'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'authenticate':
            return await this.handleAuthenticate();
          case 'get_access_token':
            return await this.handleGetAccessToken();
          case 'check_auth_status':
            return await this.handleCheckAuthStatus();
          case 'clear_token_cache':
            return await this.handleClearTokenCache();
          case 'make_authenticated_request':
            return await this.handleMakeAuthenticatedRequest(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async handleAuthenticate() {
    await this.acquireToken();
    return {
      content: [
        {
          type: 'text',
          text: '✅ Successfully authenticated with Azure AD\n\nToken expires: ' + this.tokenExpiry?.toLocaleString(),
        },
      ],
    };
  }

  async handleGetAccessToken() {
    const token = await this.acquireToken();
    return {
      content: [
        {
          type: 'text',
          text: `Access Token:\n\n${token}\n\nExpires: ${this.tokenExpiry?.toLocaleString()}`,
        },
      ],
    };
  }

  async handleCheckAuthStatus() {
    const isAuthenticated = this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry;
    const status = isAuthenticated
      ? `✅ Authenticated\n\nToken expires: ${this.tokenExpiry.toLocaleString()}\nTime remaining: ${Math.floor((this.tokenExpiry - new Date()) / 1000 / 60)} minutes`
      : '❌ Not authenticated or token expired';

    return {
      content: [
        {
          type: 'text',
          text: status,
        },
      ],
    };
  }

  async handleClearTokenCache() {
    this.accessToken = null;
    this.tokenExpiry = null;
    try {
      if (fs.existsSync(this.tokenCachePath)) {
        fs.unlinkSync(this.tokenCachePath);
      }
    } catch (error) {
      console.error('Failed to delete token cache file:', error.message);
    }
    return {
      content: [
        {
          type: 'text',
          text: '✅ Token cache cleared',
        },
      ],
    };
  }

  async handleMakeAuthenticatedRequest(args) {
    const { url, method = 'GET', headers = {}, body } = args;

    const token = await this.acquireToken();

    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          ...headers,
        },
        data: body,
        validateStatus: () => true, // Don't throw on any status
      });

      return {
        content: [
          {
            type: 'text',
            text: `Status: ${response.status} ${response.statusText}\n\nResponse:\n\n${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Azure AD MCP Server running on stdio');
  }
}

const server = new AzureADMCPServer();
server.run().catch(console.error);
