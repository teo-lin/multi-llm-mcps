export const tools = [
  {
    name: "query_logs",
    description: "Execute a CloudWatch Logs Insights query",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "CloudWatch Logs Insights query string",
        },
        logGroups: {
          type: "array",
          items: { type: "string" },
          description: "Array of log group names to query",
        },
        startTime: {
          type: "string",
          description:
            'Start time for the query (ISO 8601 format or relative like "1h", "1d")',
        },
        endTime: {
          type: "string",
          description:
            'End time for the query (ISO 8601 format or relative like "now")',
        },
        limit: {
          type: "number",
          description: "Maximum number of log entries to return (default: 100)",
          default: 100,
        },
      },
      required: ["query", "logGroups"],
    },
  },
  {
    name: "list_log_groups",
    description: "List available CloudWatch log groups",
    inputSchema: {
      type: "object",
      properties: {
        namePrefix: {
          type: "string",
          description: "Filter log groups by name prefix",
        },
        limit: {
          type: "number",
          description: "Maximum number of log groups to return (default: 50)",
          default: 50,
        },
      },
    },
  },
  {
    name: "get_recent_logs",
    description: "Get recent log entries from a specific log group",
    inputSchema: {
      type: "object",
      properties: {
        logGroup: {
          type: "string",
          description: "Name of the log group",
        },
        hours: {
          type: "number",
          description: "Number of hours to look back (default: 1)",
          default: 1,
        },
        limit: {
          type: "number",
          description: "Maximum number of log entries to return (default: 100)",
          default: 100,
        },
        filterPattern: {
          type: "string",
          description: "Optional filter pattern for log entries",
        },
      },
      required: ["logGroup"],
    },
  },
]
