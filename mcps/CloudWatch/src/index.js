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

    const config = {
      region:
        process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    }

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
      if (process.env.AWS_SESSION_TOKEN) {
        config.credentials.sessionToken = process.env.AWS_SESSION_TOKEN
      }
    }

    this.cloudWatchClient = new CloudWatchLogsClient(config)

    // Parse allowed log groups from environment variable
    this.allowedLogGroups = process.env.ALLOWED_LOG_GROUPS
      ? process.env.ALLOWED_LOG_GROUPS.split(",").map((g) => g.trim())
      : null

    this.setupHandlers()
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

      const startQueryResponse = await this.cloudWatchClient.send(
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

        const resultsResponse = await this.cloudWatchClient.send(
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
      const response = await this.cloudWatchClient.send(
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
