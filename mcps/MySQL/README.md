# MySQL MCP Server

## Features

MCP server for MySQL 8.0 with connection pooling and parameterized queries.

- Execute SQL queries with parameterized placeholders
- List databases and tables
- Describe table structures
- Connection pooling for performance

## Prerequisites

- Node.js >=18.0.0
- MySQL 8.0+

```bash
# Setup environment
cp .env.example .env
# Add:
#   MYSQL_HOST=localhost
#   MYSQL_PORT=3306
#   MYSQL_USER=root
#   MYSQL_PASSWORD=password
#   MYSQL_DATABASE=mydb
```

## Setup

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add mysql --scope user -- npx --yes @teolin/mcp-local-mysql
gemini mcp add mysql npx --yes @teolin/mcp-local-mysql

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-local-mysql
claude mcp add mysql --scope user -- mysql-mcp
gemini mcp add mysql mysql-mcp

# Option 3: Local project
npm install @teolin/mcp-local-mysql
claude mcp add mysql --scope project -- node ./node_modules/@teolin/mcp-local-mysql/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
claude mcp remove mysql --scope user
gemini mcp remove mysql
```

---

## Available Tools

### 1. query
Execute SQL queries with parameterized queries. Supports `?` placeholders for parameters.

### 2. list_databases
List all databases.

### 3. list_tables
List tables in a database. Parameters: `database` (required).

### 4. describe_table
Show table structure. Parameters: `database` (required), `table` (required).

## Usage Examples

### Example 1: Execute query
```javascript
// In Claude Code:
"Get all users from the users table where status = 'active'"
// Uses: query with parameterized placeholders
```

### Example 2: List databases
```javascript
// In Claude Code:
"Show me all databases in MySQL"
// Lists available databases
```

### Example 3: Describe table
```javascript
// In Claude Code:
"Show me the structure of the users table"
// Returns table schema
```

### Example 4: Search data
```javascript
// In Claude Code:
"Find all orders where customer_id = 123"
// Retrieves matching records
```
