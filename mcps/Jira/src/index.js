#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { JiraClient } from "./jira-client.js"
import { tools } from "./tools.js"

const server = new Server(
  {
    name: "doctari-jira-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

const jiraClient = new JiraClient()

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "get_ticket_details": {
        const ticket = await jiraClient.getTicketDetails(args.ticket_key)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Jira: get_ticket_details ••••••••••••\n${JSON.stringify(
                ticket,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "search_tickets_jql": {
        const results = await jiraClient.searchTickets(
          args.jql,
          args.max_results || 50
        )
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Jira: search_tickets_jql ••••••••••••\n${JSON.stringify(
                results,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_board_issues": {
        const issues = await jiraClient.getBoardIssues(
          args.board_id,
          args.sprint_id
        )
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Jira: get_board_issues ••••••••••••\n${JSON.stringify(
                issues,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_ptls_board_bugs": {
        const bugs = await jiraClient.getPtlsBoardBugs(args.team_name)
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Jira: get_ptls_board_bugs ••••••••••••\n${JSON.stringify(
                bugs,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_absences_bugs": {
        const bugs = await jiraClient.getPtlsBoardBugs("absences")
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Jira: get_absences_bugs ••••••••••••\n${JSON.stringify(
                bugs,
                null,
                2
              )}`,
            },
          ],
        }
      }

      case "get_team_names": {
        const teams = await jiraClient.getTeamNames()
        return {
          content: [
            {
              type: "text",
              text: `•••••••••••• MCP.Jira: get_team_names ••••••••••••\n${JSON.stringify(
                teams,
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
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error("Server error:", error)
  process.exit(1)
})
