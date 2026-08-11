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

## Setup and Usage

Three ways to run this server. Pick one — they all end with the same MCP registered in your agent.

| Method         | What it does                              | Use it when                            |
| -------------- | ----------------------------------------- | -------------------------------------- |
| **npx**        | Downloads and runs on demand, nothing kept | Trying it out, or always want latest    |
| **npm install**| Installs once, runs from disk              | Daily use — fastest start, works offline |
| **clone repo** | Runs your own source copy                  | You want to change the server code       |

### npx

No install. npx fetches the package on first run and caches it, so the first start is slower.

```bash
claude mcp add mysql --scope user -- npx --yes @teolin/mcp-local-mysql
gemini mcp add mysql npx --yes @teolin/mcp-local-mysql
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add mysql --scope user --env MYSQL_HOST=127.0.0.1 -- npx --yes @teolin/mcp-local-mysql
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-local-mysql
claude mcp add mysql --scope user -- mysql-mcp
gemini mcp add mysql mysql-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-local-mysql
claude mcp add mysql --scope project -- node ./node_modules/@teolin/mcp-local-mysql/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/MySQL
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add mysql --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-local-mysql` for `mysql-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "mysql": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-local-mysql"],
      "env": { "MYSQL_HOST": "127.0.0.1" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add mysql --env MYSQL_HOST=127.0.0.1 -- npx --yes @teolin/mcp-local-mysql
```

```toml
[mcp_servers.mysql]
command = "npx"
args = ["--yes", "@teolin/mcp-local-mysql"]

[mcp_servers.mysql.env]
MYSQL_HOST = "127.0.0.1"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add mysql -- npx --yes @teolin/mcp-local-mysql
```

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-local-mysql"],
      "env": { "MYSQL_HOST": "127.0.0.1" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  mysql:
    type: stdio
    name: mysql
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-local-mysql"]
    envs: { MYSQL_HOST: "127.0.0.1" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

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
