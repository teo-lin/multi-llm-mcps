#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

class MySQLMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "mysql-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? "127.0.0.1",
      port: parseInt(process.env.MYSQL_PORT ?? "3306"),
      user: process.env.MYSQL_USER ?? "root",
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 5,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    await this.pool.end();
  }

  async executeQuery(query, params, database) {
    const connection = await this.pool.getConnection();
    try {
      if (database) {
        await connection.query(`USE ??`, [database]);
      }

      const [rows, fields] = await connection.query(query, params);

      const fieldNames = Array.isArray(fields)
        ? fields.map((f) => f.name)
        : [];

      return {
        rows: Array.isArray(rows) ? rows : [],
        fields: fieldNames,
      };
    } catch (error) {
      throw new Error(
        `Query execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      connection.release();
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "query": {
            if (!args) throw new Error("`query` requires arguments");
            const query = args.query;
            const params = args.params;
            const database = args.database;

            const result = await this.executeQuery(query, params, database);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case "list_databases": {
            const result = await this.executeQuery("SHOW DATABASES");
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result.rows, null, 2),
                },
              ],
            };
          }

          case "list_tables": {
            if (!args) throw new Error("`list_tables` requires arguments");
            const database = args.database;
            const result = await this.executeQuery(
              "SHOW TABLES",
              undefined,
              database
            );
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result.rows, null, 2),
                },
              ],
            };
          }

          case "describe_table": {
            if (!args) throw new Error("`describe_table` requires arguments");
            const database = args.database;
            const table = args.table;
            const result = await this.executeQuery(
              "DESCRIBE ??",
              [table],
              database
            );
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result.rows, null, 2),
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
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MySQL MCP server running on stdio");
  }
}

const server = new MySQLMCPServer();
server.run().catch(console.error);
