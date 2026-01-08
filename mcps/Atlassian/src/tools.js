export const tools = [
  {
    name: "jira_ticket_info",
    description: "Get Jira ticket information",
    inputSchema: {
      type: "object",
      properties: {
        ticket_key: {
          type: "string",
          description: "Jira ticket key (e.g., PAB-2197)",
        },
        working_directory: {
          type: "string",
          description:
            "Optional: Working directory path (defaults to current working directory)",
        },
      },
      required: ["ticket_key"],
    },
  },
  {
    name: "jira_extract_ticket_from_text",
    description:
      "Extract Jira ticket key from text (PR title, branch name, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to search for Jira ticket key",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "jira_open_ticket",
    description: "Open Jira ticket in browser",
    inputSchema: {
      type: "object",
      properties: {
        ticket_key: {
          type: "string",
          description: "Jira ticket key to open",
        },
      },
      required: ["ticket_key"],
    },
  },
  {
    name: "jira_auth_status",
    description: "Check Atlassian CLI authentication status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]
