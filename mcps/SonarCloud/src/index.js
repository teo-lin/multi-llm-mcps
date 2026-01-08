#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { SonarClient } from "./sonar-client.js"
import { tools } from "./tools.js"

const sonarClient = new SonarClient()

const server = new Server(
  {
    name: "sonarcloud-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "get_project_status": {
        const status = await sonarClient.getProjectStatus()
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_project_status ••••••••••••\n${JSON.stringify(
                status,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_issues": {
        const options = {
          severities: args.severities,
          types: args.types,
          statuses: args.statuses,
          resolved: args.resolved || false,
          ps: args.pageSize || 100,
          p: args.page || 1,
        }
        const issues = await sonarClient.getIssues(options)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_issues ••••••••••••\n${JSON.stringify(
                issues,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_issue_details": {
        const issue = await sonarClient.getIssueDetails(args.issueKey)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_issue_details ••••••••••••\n${JSON.stringify(
                issue,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_measures": {
        const metricKeys = args.metricKeys
          ? args.metricKeys.split(",").map((k) => k.trim())
          : undefined
        const measures = await sonarClient.getMeasures(metricKeys)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_measures ••••••••••••\n${JSON.stringify(
                measures,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_security_hotspots": {
        const options = {
          status: args.status,
          resolution: args.resolution,
          ps: args.pageSize || 100,
          p: args.page || 1,
        }
        const hotspots = await sonarClient.getHotspots(options)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_security_hotspots ••••••••••••\n${JSON.stringify(
                hotspots,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_hotspot_details": {
        const hotspot = await sonarClient.getHotspotDetails(args.hotspotKey)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_hotspot_details ••••••••••••\n${JSON.stringify(
                hotspot,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_files": {
        const options = {
          qualifiers: args.qualifiers || "FIL",
          ps: args.pageSize || 100,
          p: args.page || 1,
        }
        const files = await sonarClient.getComponentTree(options)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_files ••••••••••••\n${JSON.stringify(
                files,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_source_code": {
        const options = {
          from: args.from,
          to: args.to,
        }
        const source = await sonarClient.getSourceCode(args.fileKey, options)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_source_code ••••••••••••\n${source}`,
            },
          ],
        }
      }

      case "get_rules": {
        const options = {
          languages: args.languages,
          types: args.types,
          severities: args.severities,
          ps: args.pageSize || 100,
          p: args.page || 1,
        }
        const rules = await sonarClient.getRules(options)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_rules ••••••••••••\n${JSON.stringify(
                rules,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_rule_details": {
        const rule = await sonarClient.getRuleDetails(args.ruleKey)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_rule_details ••••••••••••\n${JSON.stringify(
                rule,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_analyses_history": {
        const options = {
          ps: args.pageSize || 10,
          p: args.page || 1,
        }
        const analyses = await sonarClient.getProjectAnalyses(options)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_analyses_history ••••••••••••\n${JSON.stringify(
                analyses,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_issues_summary": {
        // Get all issue types
        const [bugs, vulnerabilities, codeSmells, hotspots] = await Promise.all(
          [
            sonarClient.getIssues({ types: "BUG", ps: 500 }),
            sonarClient.getIssues({ types: "VULNERABILITY", ps: 500 }),
            sonarClient.getIssues({ types: "CODE_SMELL", ps: 500 }),
            sonarClient.getHotspots({ ps: 500 }),
          ]
        )

        const summary = {
          total: {
            bugs: bugs.total || 0,
            vulnerabilities: vulnerabilities.total || 0,
            codeSmells: codeSmells.total || 0,
            securityHotspots: hotspots.paging?.total || 0,
          },
          bySeverity: {},
          byStatus: {},
        }

        // Aggregate by severity and status
        const allIssues = [
          ...(bugs.issues || []),
          ...(vulnerabilities.issues || []),
          ...(codeSmells.issues || []),
        ]

        allIssues.forEach((issue) => {
          // By severity
          summary.bySeverity[issue.severity] =
            (summary.bySeverity[issue.severity] || 0) + 1
          // By status
          summary.byStatus[issue.status] =
            (summary.byStatus[issue.status] || 0) + 1
        })

        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.SonarCloud: get_issues_summary ••••••••••••\n${JSON.stringify(
                summary,
                null,
                2
              )}`,
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)

console.log("  SonarCloud MCP Server running on stdio")
