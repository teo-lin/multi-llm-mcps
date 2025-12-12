# MySQL MCP Server

MCP server for MySQL 8.0 with connection pooling and parameterized queries.

## Features

- Execute SQL queries with parameterized placeholders
- List databases and tables
- Describe table structures
- Connection pooling for performance

## Prerequisites

- Node.js >=25.2.1
- MySQL 8.0+

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g local-mysql-mcp-server
```

### Option 2: Install locally

```bash
npm install local-mysql-mcp-server
```

### Option 3: Use with npx (no installation)

```bash
npx -y local-mysql-mcp-server
```

## Setup

1. Configure `.env`:
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

Required environment variables:
- `MYSQL_HOST` - MySQL host (e.g., `localhost`)
- `MYSQL_PORT` - MySQL port (e.g., `3306`)
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - Default database name

## Usage

### Running as a standalone server

```bash
# If installed globally
mysql-mcp

# If installed locally
npx local-mysql-mcp-server

# Or using npm start (for development)
npm start
```

### Running tests

```bash
npm test
```

## Available Tools

- `query` - Execute SQL queries (supports parameterized queries with `?` placeholders)
- `list_databases` - List all databases
- `list_tables` - List tables in a database
- `describe_table` - Show table structure

## Integration with Claude Code

Add to your Claude Code MCP configuration file (`~/.claude/config.json` or `.claude/config.json` in your project):

### Using npx (Recommended - no global installation needed)

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "local-mysql-mcp-server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

### Using global installation

```json
{
  "mcpServers": {
    "mysql": {
      "command": "mysql-mcp",
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

## Requirements

- Node.js >=25.2.1
- MySQL 8.0+
- Published on npm: [local-mysql-mcp-server](https://www.npmjs.com/package/local-mysql-mcp-server)

## License

MIT
