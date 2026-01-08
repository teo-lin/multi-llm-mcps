#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';
const JIRA_SITE = process.env.JIRA_SITE || 'your-domain.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_AUTH_STRATEGY = process.env.JIRA_AUTH_STRATEGY || 'auto'; // 'oauth', 'basic', or 'auto'

const log = {
  info: (message) => console.error(`${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.error(`[WARN] ${message}`),
};

class AtlassianServer {
  constructor() {
    this.server = new Server(
      {
        name: "atlassian-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.oauthAvailable = null; // Cache oauth availability check

    // Configure axios client for basic auth
    this.hasBasicAuth = !!(JIRA_EMAIL && JIRA_API_TOKEN);
    if (this.hasBasicAuth) {
      this.axiosClient = axios.create({
        baseURL: JIRA_BASE_URL,
        auth: {
          username: JIRA_EMAIL,
          password: JIRA_API_TOKEN,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    }

    this.setupToolHandlers();
  }

  async _isOAuthAvailable() {
    if (this.oauthAvailable !== null) {
      return this.oauthAvailable;
    }

    try {
      const { stdout } = await execAsync("acli jira auth status");
      this.oauthAvailable = stdout.includes("✓") || stdout.includes("authenticated") || stdout.includes("logged in");
      return this.oauthAvailable;
    } catch (error) {
      this.oauthAvailable = false;
      return false;
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "jira_ticket_info",
            description: "Get Jira ticket information",
            inputSchema: {
              type: "object",
              properties: {
                ticket_key: {
                  type: "string",
                  description: "Jira ticket key (e.g., PAB-2197)",
                },
                working_directory: {
                  type: "string",
                  description: "Optional: Working directory path (defaults to current working directory)",
                },
              },
              required: ["ticket_key"],
            },
          },
          {
            name: "jira_extract_ticket_from_text",
            description: "Extract Jira ticket key from text (PR title, branch name, etc.)",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Text to search for Jira ticket key",
                },
              },
              required: ["text"],
            },
          },
          {
            name: "jira_open_ticket",
            description: "Open Jira ticket in browser",
            inputSchema: {
              type: "object",
              properties: {
                ticket_key: {
                  type: "string",
                  description: "Jira ticket key to open",
                },
              },
              required: ["ticket_key"],
            },
          },
          {
            name: "jira_auth_status",
            description: "Check Atlassian CLI authentication status",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { working_directory } = request.params.arguments;

      try {
        if (working_directory) {
          process.chdir(working_directory);
        }

        switch (request.params.name) {
          case "jira_ticket_info":
            return await this.handleTicketInfo(request.params.arguments);
          case "jira_extract_ticket_from_text":
            return await this.handleExtractTicket(request.params.arguments);
          case "jira_open_ticket":
            return await this.handleOpenTicket(request.params.arguments);
          case "jira_auth_status":
            return await this.handleAuthStatus();
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Atlassian operation failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }

  async handleTicketInfo(args) {
    const ticket = await this.getJiraTicketInfo(args.ticket_key);

    return {
      content: [
        {
          type: "text",
          text: `✴️ ✴️ ✴️ ✴️  MCP.Atlassian: jira_ticket_info ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify(ticket, null, 2)}`,
        },
      ],
    };
  }

  async handleExtractTicket(args) {
    const ticketKey = this.extractJiraTicketFromText(args.text);

    return {
      content: [
        {
          type: "text",
          text: `✴️ ✴️ ✴️ ✴️  MCP.Atlassian: jira_extract_ticket_from_text ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({ ticketKey }, null, 2)}`,
        },
      ],
    };
  }

  async handleOpenTicket(args) {
    await this.openJiraTicketInBrowser(args.ticket_key);

    return {
      content: [
        {
          type: "text",
          text: `✴️ ✴️ ✴️ ✴️  MCP.Atlassian: jira_open_ticket ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({ opened: true, ticket: args.ticket_key }, null, 2)}`,
        },
      ],
    };
  }

  async handleAuthStatus() {
    const isAuthenticated = await this.verifyAtlassianAuth();

    return {
      content: [
        {
          type: "text",
          text: `✴️ ✴️ ✴️ ✴️  MCP.Atlassian: jira_auth_status ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({ authenticated: isAuthenticated }, null, 2)}`,
        },
      ],
    };
  }

  extractJiraTicketFromText(text) {
    const match = text.match(/([A-Z]+-\d+)/);
    return match ? match[1] : null;
  }

  async _getTicketInfoViaOAuth(ticketKey) {
    const { stdout } = await execAsync(
      `acli jira workitem view ${ticketKey} --json`
    );
    const ticket = JSON.parse(stdout);

    return {
      key: ticket.key,
      summary: ticket.fields.summary,
      description:
        ticket.fields.description?.content?.[0]?.content?.[0]?.text ||
        "No description",
      acceptanceCriteria: this.extractAcceptanceCriteria(
        ticket.fields.description
      ),
      status: ticket.fields.status.name,
      url: `${JIRA_BASE_URL}/browse/${ticketKey}`,
    };
  }

  async _getTicketInfoViaBasicAuth(ticketKey) {
    if (!this.hasBasicAuth) {
      throw new Error("Basic auth not configured. Set JIRA_EMAIL and JIRA_API_TOKEN environment variables.");
    }

    const response = await this.axiosClient.get(`/rest/api/3/issue/${ticketKey}`);
    const ticket = response.data;

    return {
      key: ticket.key,
      summary: ticket.fields.summary,
      description: this.extractDescriptionText(ticket.fields.description) || "No description",
      acceptanceCriteria: this.extractAcceptanceCriteria(ticket.fields.description),
      status: ticket.fields.status.name,
      url: `${JIRA_BASE_URL}/browse/${ticketKey}`,
    };
  }

  async getJiraTicketInfo(ticketKey) {
    const errors = [];

    // Try OAuth first if strategy is 'oauth' or 'auto'
    if (JIRA_AUTH_STRATEGY === 'oauth' || JIRA_AUTH_STRATEGY === 'auto') {
      const oauthAvailable = await this._isOAuthAvailable();
      if (oauthAvailable) {
        try {
          log.info(`[Atlassian MCP] Fetching ticket ${ticketKey} via OAuth (acli)`);
          const ticket = await this._getTicketInfoViaOAuth(ticketKey);
          await this.openJiraTicketInBrowser(ticketKey);
          return ticket;
        } catch (error) {
          log.error(`[Atlassian MCP] OAuth failed: ${error.message}`);
          errors.push(`OAuth: ${error.message}`);

          if (JIRA_AUTH_STRATEGY === 'oauth') {
            await this.openJiraTicketInBrowser(ticketKey);
            return {
              key: ticketKey,
              summary: `Jira ticket ${ticketKey} (acli access failed)`,
              description: `View ticket at: ${JIRA_BASE_URL}/browse/${ticketKey}`,
              status: "Unknown",
              url: `${JIRA_BASE_URL}/browse/${ticketKey}`,
            };
          }
        }
      }
    }

    // Try basic auth if strategy is 'basic' or 'auto' (and oauth failed)
    if (JIRA_AUTH_STRATEGY === 'basic' || JIRA_AUTH_STRATEGY === 'auto') {
      try {
        log.info(`[Atlassian MCP] Fetching ticket ${ticketKey} via Basic Auth (API token)`);
        const ticket = await this._getTicketInfoViaBasicAuth(ticketKey);
        await this.openJiraTicketInBrowser(ticketKey);
        return ticket;
      } catch (error) {
        log.error(`[Atlassian MCP] Basic auth failed: ${error.message}`);
        errors.push(`Basic Auth: ${error.message}`);
      }
    }

    // All auth methods failed, return fallback
    await this.openJiraTicketInBrowser(ticketKey);
    return {
      key: ticketKey,
      summary: `Jira ticket ${ticketKey} (all auth methods failed)`,
      description: `View ticket at: ${JIRA_BASE_URL}/browse/${ticketKey}. Errors: ${errors.join(', ')}`,
      status: "Unknown",
      url: `${JIRA_BASE_URL}/browse/${ticketKey}`,
    };
  }

  async openJiraTicketInBrowser(ticketKey) {
    try {
      await execAsync(`open "${JIRA_BASE_URL}/browse/${ticketKey}"`);
      log.info(`Opened Jira ticket ${ticketKey} in browser`);
    } catch (error) {
      log.error(`Failed to open Jira ticket ${ticketKey}: ${error}`);
    }
  }

  extractDescriptionText(description) {
    if (!description?.content) return undefined;

    const text = description.content
      .map((block) =>
        block.content?.map((item) => item.text).join(" ")
      )
      .join(" ");

    return text || undefined;
  }

  extractAcceptanceCriteria(description) {
    if (!description?.content) return undefined;

    const text = description.content
      .map((block) =>
        block.content?.map((item) => item.text).join(" ")
      )
      .join(" ");

    const acMatch = text.match(
      /(?:acceptance criteria|ac)[:\s]+(.*?)(?:\n|$)/is
    );
    return acMatch?.[1]?.trim();
  }

  async attemptAutoAuth() {
    try {
      const envPath = path.join(__dirname, '..', '.env');

      if (!fs.existsSync(envPath)) {
        log.warn("No .env file found for auto-authentication");
        return false;
      }

      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};

      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.trim().split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      });

      const { JIRA_SITE, JIRA_EMAIL, JIRA_API_TOKEN } = envVars;

      if (!JIRA_SITE || !JIRA_EMAIL || !JIRA_API_TOKEN) {
        log.warn("Missing JIRA credentials in .env file");
        return false;
      }

      log.info("🔑 Attempting authentication with stored credentials...");

      const tokenFile = '/tmp/jira_token_mcp';
      fs.writeFileSync(tokenFile, JIRA_API_TOKEN);

      try {
        await execAsync(`acli jira auth login --site "${JIRA_SITE}" --email "${JIRA_EMAIL}" --token < ${tokenFile}`);
        fs.unlinkSync(tokenFile); // Clean up

        const { stdout } = await execAsync("acli jira auth status");
        if (stdout.includes("✓") || stdout.includes("authenticated")) {
          log.info("✅ Auto-authentication successful!");
          return true;
        }
      } catch (authError) {
        fs.unlinkSync(tokenFile); // Clean up on error
        log.error(`Auto-authentication failed: ${authError}`);
      }

      return false;
    } catch (error) {
      log.error(`Auto-authentication error: ${error}`);
      return false;
    }
  }

  async verifyAtlassianAuth() {
    try {
      const { stdout } = await execAsync("acli jira auth status");
      if (stdout.includes("✓") || stdout.includes("authenticated") || stdout.includes("logged in")) {
        log.info("✅ Atlassian CLI authenticated");
        return true;
      } else {
        log.info("🔐 Atlassian CLI not authenticated, attempting auto-auth...");
        return await this.attemptAutoAuth();
      }
    } catch (error) {
      log.info("🔐 Atlassian CLI not authenticated, attempting auto-auth...");
      return await this.attemptAutoAuth();
    }
  }

  async run() {
    log.info("🌊 ---- STARTING Atlassian MCP ---- 🌊");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log.info("Atlassian MCP server running on stdio");
  }
}

const server = new AtlassianServer();
server.run().catch(log.error);
