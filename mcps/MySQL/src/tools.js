export const tools = [
  {
    name: "query",
    description:
      "Execute a SQL query on the MySQL database. Supports parameterized queries for safety. Use ? as placeholders and provide params array.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The SQL query to execute. Use ? for parameters (e.g., 'SELECT * FROM users WHERE id = ?')",
        },
        params: {
          type: "array",
          description:
            "Optional: Array of parameters to bind to the query placeholders",
          items: {
            type: ["string", "number", "boolean", "null"],
          },
        },
        database: {
          type: "string",
          description: "Optional: Database name to use for this query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_databases",
    description: "List all databases in the MySQL instance",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_tables",
    description: "List all tables in a specific database",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Database name",
        },
      },
      required: ["database"],
    },
  },
  {
    name: "describe_table",
    description: "Show the structure of a table",
    inputSchema: {
      type: "object",
      properties: {
        database: {
          type: "string",
          description: "Database name",
        },
        table: {
          type: "string",
          description: "Table name",
        },
      },
      required: ["database", "table"],
    },
  },
]
