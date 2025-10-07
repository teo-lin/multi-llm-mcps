# MySQL MCP Server

MCP server for MySQL 8.0 with connection pooling and parameterized queries.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env`:
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

3. Test:
```bash
npm test
```

## Available Tools

- `query` - Execute SQL queries (supports parameterized queries with `?` placeholders)
- `list_databases` - List all databases
- `list_tables` - List tables in a database
- `describe_table` - Show table structure

## Usage

**Run locally:**
```bash
npm start
```

**Add to Claude Code:**
```bash
cd /path/to/_MCP
./scripts/register-all.sh

# Or register individually:
claude mcp add mysql /path/to/_MCP/MySQL/start-mcp.sh
```

## Requirements

- Node.js 24.9.0
- MySQL 8.0
