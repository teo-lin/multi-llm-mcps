#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// MCP-safe logging (must use stderr to avoid interfering with MCP protocol)
const log = {
  info: (message) => console.error(`${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  warn: (message) => console.error(`[WARN] ${message}`),
};

class CodeReviewServer {
  constructor() {
    this.server = new Server(
      {
        name: "code-review-server",
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

  getProjectName(currentDir) {
    try {
      // Try to read package.json for project name
      const packagePath = path.join(currentDir, "package.json");

      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        return packageJson.name || path.basename(currentDir);
      }

      // Fallback to directory name
      return path.basename(currentDir);
    } catch (error) {
      return path.basename(currentDir);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "codereview",
            description:
              "Automated code review for GitHub PRs with Jira integration (orchestrates GitHub and Atlassian MCPs)",
            inputSchema: {
              type: "object",
              properties: {
                pr: {
                  type: ["string", "number"],
                  description: "GitHub PR number or branch name to review",
                },
                working_directory: {
                  type: "string",
                  description:
                    "Optional: Working directory path (defaults to current working directory)",
                },
              },
              required: ["pr"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "codereview") {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const { pr, working_directory } = request.params.arguments;
      const prIdentifier = String(pr);

      try {
        if (working_directory) {
          process.chdir(working_directory);
        }

        const currentDir = process.cwd();
        const projectName = this.getProjectName(currentDir);

        log.info(`🌴 CodeReview starting in: ${currentDir}`);
        log.info(`📁 Detected project: ${projectName}`);

        const review = await this.reviewPR(prIdentifier);

        return {
          content: [
            {
              type: "text",
              text: review,
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Code review failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }

  extractJiraTicketFromText(text) {
    // Extract ticket from text (e.g., feat/PAB-2197-description)
    const match = text.match(/([A-Z]+-\d+)/);
    return match ? match[1] : null;
  }

  analyzeCodeChanges(diff, requirements) {
    const comments = [];
    const lines = diff.split("\n");

    let currentFile = "";
    let lineNumber = 0;

    for (const line of lines) {
      if (line.startsWith("diff --git")) {
        const fileMatch = line.match(/b\/(.+)$/);
        currentFile = fileMatch?.[1] || "";
        continue;
      }

      if (line.startsWith("@@")) {
        const lineMatch = line.match(/\+(\d+)/);
        lineNumber = parseInt(lineMatch?.[1] || "0");
        continue;
      }

      if (line.startsWith("+") && !line.startsWith("+++")) {
        const code = line.substring(1).trim();

        // Check for common issues
        if (code.includes("console.log") && !code.includes("//")) {
          comments.push({
            file: currentFile,
            line: lineNumber,
            comment: "Remove console.log before merging",
          });
        }

        if (code.includes("TODO") || code.includes("FIXME")) {
          comments.push({
            file: currentFile,
            line: lineNumber,
            comment: "Address TODO/FIXME comment",
          });
        }

        if (code.includes(": any") && currentFile.endsWith(".ts")) {
          comments.push({
            file: currentFile,
            line: lineNumber,
            comment: 'Avoid "any" type, be more specific',
          });
        }

        if (code.includes("password") && !code.includes("hash")) {
          comments.push({
            file: currentFile,
            line: lineNumber,
            comment: "Ensure password handling is secure",
          });
        }

        if (code.includes("await") && !code.includes("try")) {
          // Check if we're not already in a try block (simple heuristic)
          comments.push({
            file: currentFile,
            line: lineNumber,
            comment: "Consider error handling for async operation",
          });
        }

        lineNumber++;
      }
    }

    return comments;
  }

  formatReviewOutput(prName, ticket, comments) {
    let output = `# Code Review: ${prName}\n\n`;

    if (ticket) {
      output += `## 🎫 Jira Ticket: ${ticket.key}\n`;
      output += `**Summary:** ${ticket.summary}\n`;
      output += `**Status:** ${ticket.status}\n`;
      output += `**Description:** ${ticket.description}\n`;
      if (ticket.acceptanceCriteria) {
        output += `**Acceptance Criteria:** ${ticket.acceptanceCriteria}\n`;
      }
      if (ticket.url) {
        output += `**URL:** ${ticket.url}\n`;
      }
      output += "\n";
    }

    if (comments.length > 0) {
      output += `## 💬 Review Comments\n\n`;
      for (const comment of comments) {
        const location = comment.line
          ? `${comment.file}:${comment.line}`
          : comment.file;
        output += `- ${location}\n  ${comment.comment}\n\n`;
      }
    }

    return output;
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

  async getPRInfo(prName) {
    try {
      const normalizedPR = this.normalizePRIdentifier(prName);

      // Get PR metadata - assume we're in the doctariDev/io.planer.service.absences repo context
      const { stdout: prInfo } = await execAsync(
        `gh pr view ${normalizedPR} --repo doctariDev/io.planer.service.absences --json title,body,headRefName`
      );
      const pr = JSON.parse(prInfo);

      // Get PR diff
      const { stdout: diff } = await execAsync(
        `gh pr diff ${normalizedPR} --repo doctariDev/io.planer.service.absences`
      );

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
        url: `https://doctari.atlassian.net/browse/${ticketKey}`,
      };
    } catch (error) {
      log.error(`Failed to fetch Jira ticket ${ticketKey}: ${error}`);

      // Still try to open in browser even if acli fails
      await this.openJiraTicketInBrowser(ticketKey);

      // Return a placeholder ticket with the key and URL
      return {
        key: ticketKey,
        summary: `Jira ticket ${ticketKey} (acli access failed)`,
        description: `View ticket at: https://doctari.atlassian.net/browse/${ticketKey}`,
        status: "Unknown",
        url: `https://doctari.atlassian.net/browse/${ticketKey}`,
      };
    }
  }

  async openJiraTicketInBrowser(ticketKey) {
    try {
      await execAsync(`open "https://doctari.atlassian.net/browse/${ticketKey}"`);
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

  async verifyAuthStatus() {
    const errors = [];
    let ghAuth = false;
    let acliAuth = false;

    // Check GitHub CLI auth
    try {
      await execAsync("gh auth status");
      ghAuth = true;
      log.info("✅ GitHub CLI authenticated");
    } catch (error) {
      errors.push("❌ GitHub CLI not authenticated. Run: gh auth login");
      log.error("GitHub CLI auth failed");
    }

    // Check Atlassian CLI auth
    try {
      const { stdout } = await execAsync("acli jira auth status");
      // Check for success indicators in stdout
      if (stdout.includes("✓") || stdout.includes("authenticated") || stdout.includes("logged in")) {
        acliAuth = true;
        log.info("✅ Atlassian CLI authenticated");
      } else {
        errors.push("❌ Atlassian CLI not authenticated. Run: acli jira auth login --web");
      }
    } catch (error) {
      // acli auth status returns non-zero exit code when not authenticated
      errors.push("❌ Atlassian CLI not authenticated. Run: acli jira auth login --web");
    }

    return { ghAuth, acliAuth, errors };
  }

  async reviewPR(prName) {
    let output = "🌴🐸🦚🦖🐊 ---- CodeReview MCP (Working!) ---- 🌴🐸🦚🦖🐊\n\n";

    try {
      // Step 1 of 4: Verify authentication status
      output += "**Step 1 of 4:** 🔐 Verifying authentication status...\n";
      const authStatus = await this.verifyAuthStatus();

      if (!authStatus.ghAuth) {
        return output + "❌ GitHub CLI not authenticated. Please run: `gh auth login`\n\n";
      }

      output += "✅ GitHub CLI authenticated\n";

      if (!authStatus.acliAuth) {
        output += "⚠️ Atlassian CLI not authenticated, Jira features limited\n\n";
      } else {
        output += "✅ Atlassian CLI authenticated\n\n";
      }

      // Step 2 of 4: Get PR info
      output += "**Step 2 of 4:** 📥 Fetching PR info...\n";
      const prInfo = await this.getPRInfo(prName);
      output += `✅ Found PR: ${prInfo.title}\n`;
      output += `📋 Branch: ${prInfo.headRefName}\n`;
      output += `📊 Found ${prInfo.diff.split('\n').length} lines of changes\n\n`;

      // Step 3 of 4: Extract and fetch Jira ticket
      output += "**Step 3 of 4:** 🎫 Extracting Jira ticket...\n";
      let ticketKey = this.extractJiraTicketFromText(prInfo.headRefName);
      if (!ticketKey) {
        ticketKey = this.extractJiraTicketFromText(prInfo.title);
      }
      if (!ticketKey) {
        ticketKey = this.extractJiraTicketFromText(prInfo.body);
      }

      let ticket = null;

      if (ticketKey) {
        output += `🔍 Found ticket: ${ticketKey}\n`;
        if (authStatus.acliAuth) {
          output += "📋 Fetching ticket details...\n";
          ticket = await this.getJiraTicketInfo(ticketKey);
          if (ticket) {
            output += `✅ Ticket loaded: ${ticket.summary}\n\n`;
          }
        } else {
          output += "⚠️ Skipping ticket details (Atlassian CLI not authenticated)\n\n";
          ticket = {
            key: ticketKey,
            summary: `${ticketKey} (auth required for details)`,
            description: "Atlassian CLI authentication required for full details",
            status: "Unknown",
            url: `https://doctari.atlassian.net/browse/${ticketKey}`,
          };
        }
      } else {
        output += "⚠️ No Jira ticket found in PR\n\n";
      }

      // Step 4 of 4: Analyze code changes
      output += "**Step 4 of 4:** 🧠 Analyzing code changes...\n";
      const reviewComments = this.analyzeCodeChanges(prInfo.diff, ticket);
      output += `✅ Found ${reviewComments.length} review comments\n\n`;

      // Format and return review
      const reviewOutput = this.formatReviewOutput(
        prName,
        ticket,
        reviewComments
      );

      return reviewOutput;
    } catch (error) {
      log.error(`Code review failed: ${error}`);
      return output + `❌ Code review failed: ${error}`;
    }
  }

  async run() {
    log.info("🌴🐸🦚🦖🐊 ---- STARTING CodeReview MCP ---- 🌴🐸🦚🦖🐊");
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    log.info("Code Review MCP server running on stdio");
  }
}

const server = new CodeReviewServer();
server.run().catch(log.error);
