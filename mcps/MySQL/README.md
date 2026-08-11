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

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-local-mysql`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-local-mysql`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add mysql --scope user -- npx --yes @teolin/mcp-local-mysql
gemini mcp add mysql npx --yes @teolin/mcp-local-mysql
codex  mcp add mysql -- npx --yes @teolin/mcp-local-mysql
devin  mcp add mysql --scope user -- npx --yes @teolin/mcp-local-mysql

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add mysql --scope user -- mysql-mcp
gemini mcp add mysql mysql-mcp
codex  mcp add mysql -- mysql-mcp
devin  mcp add mysql --scope user -- mysql-mcp

# local setup (npm, one project): point at the installed file
claude mcp add mysql --scope project -- node ./node_modules/@teolin/mcp-local-mysql/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/MySQL:
claude mcp add mysql --scope user -- "$PWD/start-mcp.sh"
gemini mcp add mysql --scope user "$PWD/start-mcp.sh"
codex  mcp add mysql -- "$PWD/start-mcp.sh"
devin  mcp add mysql --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add mysql --scope user --env MYSQL_HOST=127.0.0.1 -- npx --yes @teolin/mcp-local-mysql
gemini mcp add mysql --scope user -e MYSQL_HOST=127.0.0.1 npx --yes @teolin/mcp-local-mysql
codex  mcp add mysql --env MYSQL_HOST=127.0.0.1 -- npx --yes @teolin/mcp-local-mysql
devin  mcp add mysql --scope user -e MYSQL_HOST=127.0.0.1 -- npx --yes @teolin/mcp-local-mysql
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove mysql --scope user
gemini mcp remove mysql --scope user
codex  mcp remove mysql
devin  mcp remove mysql --scope user
```

`claude mcp get mysql`, `codex mcp get mysql` and `devin mcp get mysql` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
