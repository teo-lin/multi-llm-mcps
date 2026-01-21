# MySQL MCP Server

MCP server for MySQL 8.0 with connection pooling and parameterized queries.

## Features

- Execute SQL queries with parameterized placeholders
- List databases and tables
- Describe table structures
- Connection pooling for performance

## Prerequisites

- Node.js >=18.0.0
- MySQL 8.0+

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add mysql -s user -- npx -y @teolin/mcp-local-mysql

# Or Project scope (shared with team via git)
claude mcp add mysql -s project -- npx -y @teolin/mcp-local-mysql
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx -y @teolin/mcp-local-mysql` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/mcp-local-mysql

# Either User scope (available in all projects)
claude mcp add mysql -s user -- mysql-mcp

# Or Project scope (shared with team via git)
claude mcp add mysql -s project -- mysql-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `mysql-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/mcp-local-mysql

# Either User scope (available in all projects)
claude mcp add mysql -s user -- node ./node_modules/@teolin/mcp-local-mysql/src/index.js

# Or Project scope (shared with team via git)
claude mcp add mysql -s project -- node ./node_modules/@teolin/mcp-local-mysql/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-local-mysql/src/index.js` on start)

---

## Configuration

Configure `.env`:
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

## Available Tools

- `query` - Execute SQL queries (supports parameterized queries with `?` placeholders)
- `list_databases` - List all databases
- `list_tables` - List tables in a database
- `describe_table` - Show table structure

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-local-mysql" → Run workflow
2. The workflow will automatically:
   - Install dependencies
   - Run the `prepublishOnly` script to make the bin executable
   - Publish to npm with public access

### Manual Publishing

#### Prerequisites

1. You need an npm account: https://www.npmjs.com/signup
2. Login to npm:
   ```bash
   npm login
   ```

#### Publishing Steps

1. **Test the package locally** (optional but recommended):
   ```bash
   # Test that it runs
   node src/index.js --help

   # Or test with environment variables
   MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_USER=root MYSQL_PASSWORD=password MYSQL_DATABASE=test node src/index.js
   ```

2. **Publish to npm**:
   ```bash
   npm publish
   ```

   This will:
   - Run the `prepublishOnly` script to make the bin executable
   - Only include files specified in the `files` field
   - Publish to npm with public access (configured in `publishConfig`)

3. **Verify the package**:
   ```bash
   # Test with npx (no installation)
   npx -y @teolin/mcp-local-mysql

   # Or install globally and test
   npm install -g @teolin/mcp-local-mysql
   mysql-mcp
   ```

#### Updating the Package

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes (2.0.2 -> 2.0.3)
   npm version minor  # for new features (2.0.2 -> 2.1.0)
   npm version major  # for breaking changes (2.0.2 -> 3.0.0)
   ```

2. Publish the new version:
   ```bash
   npm publish
   ```

#### Checking Published Package

View your package on npm:
- https://www.npmjs.com/package/@teolin/mcp-local-mysql

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-local-mysql
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Usage Examples

### Example 1: Query with parameters
```javascript
// In Claude Code conversation:
"Query the database: SELECT * FROM users WHERE status = ? AND age > ?"
// Parameters: ["active", 18]
```

### Example 2: List all databases
```javascript
// In Claude Code:
"Show me all databases"
// Uses: list_databases tool
```

### Example 3: Describe table structure
```javascript
// In Claude Code:
"What's the structure of the users table?"
// Uses: describe_table tool with table name "users"
```

### Example 4: Complex join query
```javascript
// In Claude Code:
"Get all orders with customer names:
SELECT o.id, o.total, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > ?"
// Parameters: ["2024-01-01"]
```

## Requirements

- Node.js >=18.0.0
- MySQL 8.0+
- Published on npm: [@teolin/mcp-local-mysql](https://www.npmjs.com/package/@teolin/mcp-local-mysql)

## License

MIT
