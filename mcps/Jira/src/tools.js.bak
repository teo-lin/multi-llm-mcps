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
  {
    name: "create_ticket",
    description: "Create a new Jira ticket",
    inputSchema: {
      type: "object",
      properties: {
        project_key: {
          type: "string",
          description: "Project key (e.g., PAB, PTLSNEW). Defaults to JIRA_DEFAULT_PROJECT",
        },
        summary: {
          type: "string",
          description: "Ticket summary/title",
        },
        description: {
          type: "string",
          description: "Ticket description",
        },
        issue_type: {
          type: "string",
          description: "Issue type (e.g., Story, Bug, Task, Sub-task)",
          default: "Story",
        },
        parent_key: {
          type: "string",
          description: "Parent ticket key for sub-tasks or stories under epics (e.g., PAB-2241)",
        },
        assignee_email: {
          type: "string",
          description: "Email of the assignee (optional)",
        },
        sprint_id: {
          type: "number",
          description: "Sprint ID to add the ticket to (optional)",
        },
      },
      required: ["summary"],
    },
  },
  {
    name: "add_to_sprint",
    description: "Add one or more tickets to a sprint",
    inputSchema: {
      type: "object",
      properties: {
        sprint_id: {
          type: "number",
          description: "Sprint ID to add tickets to",
        },
        issue_keys: {
          type: "array",
          items: { type: "string" },
          description: "Array of issue keys to add (e.g., ['PAB-123', 'PAB-456'])",
        },
      },
      required: ["sprint_id", "issue_keys"],
    },
  },
  {
    name: "get_active_sprint",
    description: "Get the active sprint for a board",
    inputSchema: {
      type: "object",
      properties: {
        board_id: {
          type: "number",
          description: "Board ID to get active sprint from",
        },
      },
      required: ["board_id"],
    },
  },
]
