#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net';
const JIRA_SITE = process.env.JIRA_SITE || 'your-domain.atlassian.net';

// MCP-safe logging (must use stderr to avoid interfering with MCP protocol)
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

    this.setupToolHandlers();
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
          text: JSON.stringify(ticket, null, 2),
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
          text: JSON.stringify({ ticketKey }, null, 2),
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
          text: JSON.stringify({ opened: true, ticket: args.ticket_key }, null, 2),
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
          text: JSON.stringify({ authenticated: isAuthenticated }, null, 2),
        },
      ],
    };
  }

  extractJiraTicketFromText(text) {
    // Extract ticket from text (e.g., feat/PAB-2197-description)
    const match = text.match(/([A-Z]+-\d+)/);
    return match ? match[1] : null;
  }

  async getJiraTicketInfo(ticketKey) {
    try {
      const { stdout } = await execAsync(
        `acli jira workitem view ${ticketKey} --json`
      );
      const ticket = JSON.parse(stdout);

      // Open Jira ticket in browser
      await this.openJiraTicketInBrowser(ticketKey);

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
    } catch (error) {
      log.error(`Failed to fetch Jira ticket ${ticketKey}: ${error}`);

      // Still try to open in browser even if acli fails
      await this.openJiraTicketInBrowser(ticketKey);

      // Return a placeholder ticket with the key and URL
      return {
        key: ticketKey,
        summary: `Jira ticket ${ticketKey} (acli access failed)`,
        description: `View ticket at: ${JIRA_BASE_URL}/browse/${ticketKey}`,
        status: "Unknown",
        url: `${JIRA_BASE_URL}/browse/${ticketKey}`,
      };
    }
  }

  async openJiraTicketInBrowser(ticketKey) {
    try {
      await execAsync(`open "${JIRA_BASE_URL}/browse/${ticketKey}"`);
      log.info(`Opened Jira ticket ${ticketKey} in browser`);
    } catch (error) {
      log.error(`Failed to open Jira ticket ${ticketKey}: ${error}`);
    }
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

      // Check if .env file exists
      if (!fs.existsSync(envPath)) {
        log.warn("No .env file found for auto-authentication");
        return false;
      }

      // Load environment variables
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

      // Create temporary token file and authenticate
      const tokenFile = '/tmp/jira_token_mcp';
      fs.writeFileSync(tokenFile, JIRA_API_TOKEN);

      try {
        await execAsync(`acli jira auth login --site "${JIRA_SITE}" --email "${JIRA_EMAIL}" --token < ${tokenFile}`);
        fs.unlinkSync(tokenFile); // Clean up

        // Verify authentication
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
      // Check for success indicators in stdout
      if (stdout.includes("✓") || stdout.includes("authenticated") || stdout.includes("logged in")) {
        log.info("✅ Atlassian CLI authenticated");
        return true;
      } else {
        log.info("🔐 Atlassian CLI not authenticated, attempting auto-auth...");
        return await this.attemptAutoAuth();
      }
    } catch (error) {
      // acli auth status returns non-zero exit code when not authenticated
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
