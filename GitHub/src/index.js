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

const execAsync = promisify(exec);

// MCP-safe logging (must use stderr to avoid interfering with MCP protocol)
const log = {
  info: (message) => console.error(`${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.error(`[WARN] ${message}`),
};

class GitHubServer {
  constructor() {
    this.server = new Server(
      {
        name: "github-server",
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

  normalizePRIdentifier(prIdentifier) {
    // Handle GitHub PR URL: https://github.com/doctariDev/io.planer.service.absences/pull/2125/files
    const urlMatch = prIdentifier.match(/github\.com\/[^\/]+\/[^\/]+\/pull\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1]; // Return just the PR number
    }

    // Handle PR number with hash: #2125
    const hashMatch = prIdentifier.match(/^#(\d+)$/);
    if (hashMatch) {
      return hashMatch[1]; // Return just the number
    }

    // Handle branch name: feat/PAB-2254 (return as-is for gh pr view)
    // Handle plain PR number: 2125 (return as-is)
    return prIdentifier;
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "github_pr_info",
            description: "Get GitHub PR information including title, body, branch name and diff",
            inputSchema: {
              type: "object",
              properties: {
                pr: {
                  type: ["string", "number"],
                  description: "GitHub PR number, URL, or branch name",
                },
                working_directory: {
                  type: "string",
                  description: "Optional: Working directory path (defaults to current working directory)",
                },
              },
              required: ["pr"],
            },
          },
          {
            name: "github_pr_diff",
            description: "Get GitHub PR diff only",
            inputSchema: {
              type: "object",
              properties: {
                pr: {
                  type: ["string", "number"],
                  description: "GitHub PR number, URL, or branch name",
                },
                working_directory: {
                  type: "string",
                  description: "Optional: Working directory path (defaults to current working directory)",
                },
              },
              required: ["pr"],
            },
          },
          {
            name: "github_auth_status",
            description: "Check GitHub CLI authentication status",
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
          case "github_pr_info":
            return await this.handlePRInfo(request.params.arguments);
          case "github_pr_diff":
            return await this.handlePRDiff(request.params.arguments);
          case "github_auth_status":
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
          `GitHub operation failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }

  async handlePRInfo(args) {
    const prIdentifier = String(args.pr);
    const prInfo = await this.getPRInfo(prIdentifier);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prInfo, null, 2),
        },
      ],
    };
  }

  async handlePRDiff(args) {
    const prIdentifier = String(args.pr);
    const diff = await this.getPRDiff(prIdentifier);

    return {
      content: [
        {
          type: "text",
          text: diff,
        },
      ],
    };
  }

  async handleAuthStatus() {
    const isAuthenticated = await this.verifyGitHubAuth();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ authenticated: isAuthenticated }, null, 2),
        },
      ],
    };
  }

  async getPRInfo(prName) {
    try {
      const normalizedPR = this.normalizePRIdentifier(prName);

      // Get PR metadata
      const { stdout: prInfo } = await execAsync(
        `gh pr view ${normalizedPR} --json title,body,headRefName`
      );
      const pr = JSON.parse(prInfo);

      // Get PR diff
      const diff = await this.getPRDiff(prName);

      return {
        title: pr.title,
        body: pr.body || "",
        headRefName: pr.headRefName,
        diff: diff,
      };
    } catch (error) {
      log.error(`Failed to get PR info: ${error}`);
      throw error;
    }
  }

  async getPRDiff(prName) {
    try {
      const normalizedPR = this.normalizePRIdentifier(prName);
      const { stdout } = await execAsync(`gh pr diff ${normalizedPR}`);
      return stdout;
    } catch (error) {
      log.error(`Failed to get PR diff: ${error}`);
      throw error;
    }
  }

  async verifyGitHubAuth() {
    try {
      await execAsync("gh auth status");
      log.info("✅ GitHub CLI authenticated");
      return true;
    } catch (error) {
      log.error("❌ GitHub CLI not authenticated");
      return false;
    }
  }

  async run() {
    log.info("🐙 ---- STARTING GitHub MCP ---- 🐙");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log.info("GitHub MCP server running on stdio");
  }
}

const server = new GitHubServer();
server.run().catch(log.error);
