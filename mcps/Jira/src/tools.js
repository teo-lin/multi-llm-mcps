export const tools = [
  {
    name: "get_ticket_details",
    description: "Get detailed information about a specific Jira ticket",
    inputSchema: {
      type: "object",
      properties: {
        ticket_key: {
          type: "string",
          description: "Jira ticket key (e.g., PAB-1234)",
        },
      },
      required: ["ticket_key"],
    },
  },
  {
    name: "search_tickets_jql",
    description: "Search for Jira tickets using JQL (Jira Query Language)",
    inputSchema: {
      type: "object",
      properties: {
        jql: {
          type: "string",
          description: "JQL query string",
        },
        max_results: {
          type: "number",
          description: "Maximum number of results to return",
          default: 50,
        },
      },
      required: ["jql"],
    },
  },
  {
    name: "get_board_issues",
    description:
      "Get issues from a specific Jira board, optionally filtered by sprint",
    inputSchema: {
      type: "object",
      properties: {
        board_id: {
          type: "number",
          description: "Jira board ID",
        },
        sprint_id: {
          type: "number",
          description: "Optional sprint ID to filter by",
        },
      },
      required: ["board_id"],
    },
  },
  {
    name: "get_ptls_board_bugs",
    description: "Get bugs from the PTLS board, optionally filtered by team",
    inputSchema: {
      type: "object",
      properties: {
        team_name: {
          type: "string",
          description: "Team name to filter by (optional)",
        },
      },
    },
  },
  {
    name: "get_absences_bugs",
    description: "Get bugs assigned to the Absences team from PTLS board",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_team_names",
    description: "Get list of available team names for validation",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]
