#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { OnyxClient } from "./onyx-client.js"
import { tools } from "./tools.js"

const server = new Server(
  {
    name: "doctari-onyx-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Lazily construct the client so a missing .env surfaces as a tool error
// rather than crashing the server at startup.
let onyx = null
function getClient() {
  if (!onyx) onyx = new OnyxClient()
  return onyx
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "search_onyx": {
        const results = await getClient().search(
          args.query,
          args.source_type || null,
          args.max_results || 10
        )
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ query: args.query, results }, null, 2),
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
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
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
