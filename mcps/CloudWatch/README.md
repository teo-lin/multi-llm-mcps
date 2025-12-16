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

## Requirements

- Node.js >=25.2.1
- AWS SDK for JavaScript v3
- Valid AWS credentials with CloudWatch Logs permissions
- Published on npm: [cloudwatch-logs-mcp-server](https://www.npmjs.com/package/cloudwatch-logs-mcp-server)

## License

MIT
