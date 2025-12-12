#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { JiraClient } from './jira-client.js';

const server = new Server(
  {
    name: 'doctari-jira-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Jira client
const jiraClient = new JiraClient();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_ticket_details',
        description: 'Get detailed information about a specific Jira ticket',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_key: {
              type: 'string',
              description: 'Jira ticket key (e.g., PAB-1234)',
            },
          },
          required: ['ticket_key'],
        },
      },
      {
        name: 'search_tickets_jql',
        description: 'Search for Jira tickets using JQL (Jira Query Language)',
        inputSchema: {
          type: 'object',
          properties: {
            jql: {
              type: 'string',
              description: 'JQL query string',
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 50,
            },
          },
          required: ['jql'],
        },
      },
      {
        name: 'get_board_issues',
        description: 'Get issues from a specific Jira board, optionally filtered by sprint',
        inputSchema: {
          type: 'object',
          properties: {
            board_id: {
              type: 'number',
              description: 'Jira board ID',
            },
            sprint_id: {
              type: 'number',
              description: 'Optional sprint ID to filter by',
            },
          },
          required: ['board_id'],
        },
      },
      {
        name: 'get_ptls_board_bugs',
        description: 'Get bugs from the PTLS board, optionally filtered by team',
        inputSchema: {
          type: 'object',
          properties: {
            team_name: {
              type: 'string',
              description: 'Team name to filter by (optional)',
            },
          },
        },
      },
      {
        name: 'get_absences_bugs',
        description: 'Get bugs assigned to the Absences team from PTLS board',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_team_names',
        description: 'Get list of available team names for validation',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_ticket_details': {
        const ticket = await jiraClient.getTicketDetails(args.ticket_key);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(ticket, null, 2),
            },
          ],
        };
      }

      case 'search_tickets_jql': {
        const results = await jiraClient.searchTickets(args.jql, args.max_results || 50);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_board_issues': {
        const issues = await jiraClient.getBoardIssues(args.board_id, args.sprint_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2),
            },
          ],
        };
      }

      case 'get_ptls_board_bugs': {
        const bugs = await jiraClient.getPtlsBoardBugs(args.team_name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(bugs, null, 2),
            },
          ],
        };
      }

      case 'get_absences_bugs': {
        const bugs = await jiraClient.getPtlsBoardBugs('absences');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(bugs, null, 2),
            },
          ],
        };
      }

      case 'get_team_names': {
        const teams = await jiraClient.getTeamNames();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(teams, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
