# CloudWatch Logs MCP Server

MCP server for querying AWS CloudWatch Logs with Log Insights.

## Features

- Execute CloudWatch Logs Insights queries
- List available log groups
- Get recent log entries from specific log groups
- Support for relative time ranges (e.g., "1h", "1d")
- Flexible query parameters and filtering

## Prerequisites

- Node.js >=25.2.1
- AWS credentials configured (via AWS CLI, environment variables, or IAM role)
- Access to CloudWatch Logs

## Installation

### Option 1: Install from npm (Recommended)

```bash
npm install -g cloudwatch-logs-mcp-server
```

### Option 2: Install locally

```bash
npm install cloudwatch-logs-mcp-server
```

### Option 3: Use with npx (no installation)

```bash
npx -y cloudwatch-logs-mcp-server
```

## Setup

### Configure AWS Credentials

Ensure AWS credentials are configured:

```bash
# Option 1: AWS CLI
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1
```

## Usage

### Running as a standalone server

```bash
# If installed globally
cloudwatch-mcp

# If installed locally
npx cloudwatch-logs-mcp-server

# Or using npm start (for development)
npm start
```

### Running tests

```bash
npm test
```

## Available Tools

### 1. query_logs
Execute CloudWatch Logs Insights queries.

**Parameters:**
- `query` (string, required): Logs Insights query string
- `logGroups` (array, required): Log group names to query
- `startTime` (string): Start time (ISO 8601 or relative like "1h", "1d")
- `endTime` (string): End time (ISO 8601 or "now")
- `limit` (number): Maximum number of results (default: 100)

**Example:**
```json
{
  "query": "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc",
  "logGroups": ["/aws/lambda/my-function"],
  "startTime": "1h",
  "limit": 50
}
```

### 2. list_log_groups
List available CloudWatch log groups.

**Parameters:**
- `namePrefix` (string, optional): Filter by name prefix
- `limit` (number): Maximum number to return (default: 50)

### 3. get_recent_logs
Get recent log entries from a specific log group.

**Parameters:**
- `logGroup` (string, required): Log group name
- `hours` (number): Hours to look back (default: 1)
- `limit` (number): Maximum entries (default: 100)
- `filterPattern` (string, optional): Filter pattern for log entries

## Integration with Claude Code

Claude Code supports three scopes for MCP server configuration:

- **User scope** (`~/.claude.json`): Available across all projects
- **Local scope** (`~/.claude.json`): Project-specific, private to you (default)
- **Project scope** (`.mcp.json` in project root): Team-shared, committed to git

### Quick Setup with CLI (Recommended)

```bash
# User scope (available in all projects)
claude mcp add cloudwatch --scope user

# Project scope (shared with team via git)
claude mcp add cloudwatch --scope project
```

### Manual Configuration

#### Using npx (Recommended - no installation needed)

Add to `.mcp.json` (project scope) or `~/.claude.json` (user scope):

```json
{
  "mcpServers": {
    "cloudwatch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "cloudwatch-logs-mcp-server"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

#### Using global installation

```json
{
  "mcpServers": {
    "cloudwatch": {
      "type": "stdio",
      "command": "cloudwatch-mcp",
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

#### Using local installation

```json
{
  "mcpServers": {
    "cloudwatch": {
      "type": "stdio",
      "command": "node",
      "args": [
        "./node_modules/cloudwatch-logs-mcp-server/src/index.js"
      ],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

**Note:** AWS credentials will be automatically picked up from your environment or AWS CLI configuration.

## Troubleshooting

### Authentication errors
- Verify AWS credentials are configured: `aws sts get-caller-identity`
- Check IAM permissions include `logs:DescribeLogGroups`, `logs:FilterLogEvents`, `logs:StartQuery`, `logs:GetQueryResults`

### Query timeout
- Reduce time range or add more specific filters
- Increase query timeout in your code

### No results returned
- Verify log group names are correct
- Check time range includes relevant logs
- Test query in AWS Console first

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-cloudwatch-logs" → Run workflow
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
   AWS_REGION=us-east-1 node src/index.js
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
   npx -y @teolin/mcp-cloudwatch-logs

   # Or install globally and test
   npm install -g @teolin/mcp-cloudwatch-logs
   cloudwatch-mcp
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
- https://www.npmjs.com/package/@teolin/mcp-cloudwatch-logs

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-cloudwatch-logs
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Requirements

- Node.js >=25.2.1
- AWS SDK for JavaScript v3
- Valid AWS credentials with CloudWatch Logs permissions
- Published on npm: [cloudwatch-logs-mcp-server](https://www.npmjs.com/package/cloudwatch-logs-mcp-server)

## License

MIT
