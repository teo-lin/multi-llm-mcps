#!/usr/bin/env node

import {
  CloudWatchLogsClient,
  StartQueryCommand,
  GetQueryResultsCommand,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import { tools } from "./tools.js"

class CloudWatchLogsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "cloudwatch-logs-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    // SSO profile used for lazy `aws sso login` on expiry. Set via AWS_PROFILE or
    // SSO_PROFILE (e.g. in .env). If unset, the default credential chain / default
    // profile is used and `aws sso login` runs without an explicit --profile.
    this.profile = process.env.AWS_PROFILE || process.env.SSO_PROFILE || null
    if (this.profile) {
      // Make the default credential chain resolve from this profile (SSO included).
      process.env.AWS_PROFILE = this.profile
    }

    this.clientConfig = {
      region:
        process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    }

    if (process.env.aws_access_key_id && process.env.aws_secret_access_key) {
      this.clientConfig.credentials = {
        accessKeyId: process.env.aws_access_key_id,
        secretAccessKey: process.env.aws_secret_access_key,
      }
      if (process.env.aws_session_token) {
        this.clientConfig.credentials.sessionToken =
          process.env.aws_session_token
      }
      // Static creds present — no lazy SSO login.
      this.ssoLoginEnabled = false
    } else {
      this.ssoLoginEnabled = true
    }

    this.createClient()

    // Parse allowed log groups from environment variable
    this.allowedLogGroups = process.env.ALLOWED_LOG_GROUPS
      ? process.env.ALLOWED_LOG_GROUPS.split(",").map((g) => g.trim())
      : null

    this.setupHandlers()
  }

  createClient() {
    // Fresh client so the credential provider re-reads the SSO token cache
    // (e.g. after a lazy `aws sso login`).
    this.cloudWatchClient = new CloudWatchLogsClient({ ...this.clientConfig })
  }

  isAuthError(error) {
    const name = error?.name || ""
    const message = error instanceof Error ? error.message : String(error || "")
    return (
      /Expired|CredentialsProviderError|UnrecognizedClient|AccessDenied|SSO/i.test(
        name
      ) ||
      /expired|sso session|token.*(expired|invalid)|needs to be authorized|invalid_grant|could not load credentials|failed to refresh/i.test(
        message
      )
    )
  }

  resolveAwsCli() {
    if (process.env.AWS_CLI) return process.env.AWS_CLI
    for (const p of [
      "/opt/homebrew/bin/aws",
      "/usr/local/bin/aws",
      "/usr/bin/aws",
    ]) {
      if (existsSync(p)) return p
    }
    return "aws" // fall back to PATH
  }

  ssoLogin() {
    // Opens the browser for device authorization. stdout MUST stay clean for the
    // MCP stdio protocol, so route all child output to stderr only.
    const cli = this.resolveAwsCli()
    const profileArg = this.profile ? ` --profile ${this.profile}` : ""
    console.error(
      `[cloudwatch-mcp] credentials expired — running: ${cli} sso login${profileArg}`
    )
    execSync(`${cli} sso login${profileArg}`, {
      stdio: ["ignore", "ignore", "inherit"],
    })
    this.createClient()
  }

  // Send a command, lazily refreshing SSO creds once on an auth error.
  async send(command) {
    try {
      return await this.cloudWatchClient.send(command)
    } catch (error) {
      if (!this.ssoLoginEnabled || this._loggingIn || !this.isAuthError(error)) {
        throw error
      }
      this._loggingIn = true
      try {
        this.ssoLogin()
      } finally {
        this._loggingIn = false
      }
      return await this.cloudWatchClient.send(command)
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "query_logs":
          return await this.handleQueryLogs(request.params.arguments)
        case "list_log_groups":
          return await this.handleListLogGroups(request.params.arguments)
        case "get_recent_logs":
          return await this.handleGetRecentLogs(request.params.arguments)
        default:
          throw new Error(`Unknown tool: ${request.params.name}`)
      }
    })
  }

  validateLogGroups(logGroups) {
    if (!this.allowedLogGroups) {
      return // No restriction
    }

    const invalidGroups = logGroups.filter(
      (lg) => !this.allowedLogGroups.includes(lg)
    )
    if (invalidGroups.length > 0) {
      throw new Error(
        `Restricted log groups. Not allowed: ${invalidGroups.join(", ")}. Allowed: ${this.allowedLogGroups.join(", ")}`
      )
    }
  }

  parseTimeString(timeStr) {
    const now = new Date()

    if (timeStr === "now") {
      return now
    }

    const relativeMatch = timeStr.match(/^(\d+)([hmsd])$/)
    if (relativeMatch) {
      const [, amount, unit] = relativeMatch
      const value = parseInt(amount)

      switch (unit) {
        case "m":
          return new Date(now.getTime() - value * 60 * 1000)
        case "h":
          return new Date(now.getTime() - value * 60 * 60 * 1000)
        case "d":
          return new Date(now.getTime() - value * 24 * 60 * 60 * 1000)
        case "s":
          return new Date(now.getTime() - value * 1000)
      }
    }

    const date = new Date(timeStr)
    if (isNaN(date.getTime())) {
      throw new Error(
        `Invalid time format: ${timeStr}. Use ISO 8601 format or relative time like "1h", "1d", "30m"`
      )
    }

    return date
  }

  async handleQueryLogs(args) {
    const {
      query,
      logGroups,
      startTime = "1h",
      endTime = "now",
      limit = 100,
    } = args

    try {
      this.validateLogGroups(logGroups)

      const startTimeDate = this.parseTimeString(startTime)
      const endTimeDate = this.parseTimeString(endTime)

      const startQueryResponse = await this.send(
        new StartQueryCommand({
          logGroupNames: logGroups,
          startTime: Math.floor(startTimeDate.getTime() / 1000),
          endTime: Math.floor(endTimeDate.getTime() / 1000),
          queryString: query,
          limit,
        })
      )

      if (!startQueryResponse.queryId) {
        throw new Error("Failed to start query - no query ID returned")
      }

      let queryStatus = "Running"
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout

      while (queryStatus === "Running" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second

        const resultsResponse = await this.send(
          new GetQueryResultsCommand({
            queryId: startQueryResponse.queryId,
          })
        )

        queryStatus = resultsResponse.status || "Unknown"

        if (queryStatus === "Complete") {
          const results = resultsResponse.results || []

          return {
            content: [
              {
                type: "text",
                text: `•••••••••••• MCP.CloudWatch: query_logs ••••••••••••\n${JSON.stringify(
                  {
                    status: "success",
                    queryId: startQueryResponse.queryId,
                    recordsMatched:
                      resultsResponse.statistics?.recordsMatched || 0,
                    recordsScanned:
                      resultsResponse.statistics?.recordsScanned || 0,
                    bytesScanned: resultsResponse.statistics?.bytesScanned || 0,
                    results: results.map((result) => {
                      const logEntry = {}
                      result.forEach((field) => {
                        if (field.field && field.value) {
                          logEntry[field.field] = field.value
                        }
                      })
                      return logEntry
                    }),
                  },
                  null,
                  2
                )}`,
              },
            ],
          }
        } else if (queryStatus === "Failed" || queryStatus === "Cancelled") {
          throw new Error(
            `Query ${queryStatus.toLowerCase()}: ${resultsResponse.status}`
          )
        }

        attempts++
      }

      if (attempts >= maxAttempts) {
        throw new Error(
          "Query timeout - results not available within 30 seconds"
        )
      }

      return {
        content: [
          {
            type: "text",
            text: `•••••••••••• MCP.CloudWatch: query_logs ••••••••••••\n${JSON.stringify(
              { status: "timeout", message: "Query timed out" },
              null,
              2
            )}`,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `•••••••••••• MCP.CloudWatch: query_logs ••••••••••••\n${JSON.stringify(
              {
                status: "error",
                message:
                  error instanceof Error ? error.message : "Unknown error",
              },
              null,
              2
            )}`,
          },
        ],
      }
    }
  }

  async handleListLogGroups(args) {
    const { namePrefix, limit = 50 } = args

    try {
      const response = await this.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: namePrefix,
          limit,
        })
      )

      let logGroups = response.logGroups || []

      // Filter to allowed log groups if restriction is set
      if (this.allowedLogGroups) {
        logGroups = logGroups.filter((lg) =>
          this.allowedLogGroups.includes(lg.logGroupName)
        )
      }

      return {
        content: [
          {
            type: "text",
            text: `•••••••••••• MCP.CloudWatch: list_log_groups ••••••••••••\n${JSON.stringify(
              {
                status: "success",
                count: logGroups.length,
                logGroups: logGroups.map((lg) => ({
                  name: lg.logGroupName,
                  creationTime: lg.creationTime
                    ? new Date(lg.creationTime).toISOString()
                    : null,
                  retentionInDays: lg.retentionInDays,
                  storedBytes: lg.storedBytes,
                })),
              },
              null,
              2
            )}`,
          },
        ],
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `•••••••••••• MCP.CloudWatch: list_log_groups ••••••••••••\n${JSON.stringify(
              {
                status: "error",
                message:
                  error instanceof Error ? error.message : "Unknown error",
              },
              null,
              2
            )}`,
          },
        ],
      }
    }
  }

  async handleGetRecentLogs(args) {
    const { logGroup, hours = 1, limit = 100, filterPattern } = args

    this.validateLogGroups([logGroup])

    const query = filterPattern
      ? `fields @timestamp, @message | filter @message like /${filterPattern}/ | sort @timestamp desc | limit ${limit}`
      : `fields @timestamp, @message | sort @timestamp desc | limit ${limit}`

    return await this.handleQueryLogs({
      query,
      logGroups: [logGroup],
      startTime: `${hours}h`,
      endTime: "now",
      limit,
    })
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error("CloudWatch Logs MCP Server running on stdio")
  }
}

const server = new CloudWatchLogsMCPServer()
server.run().catch(console.error)
