# CloudWatch Logs MCP Server

## Features

MCP server for querying AWS CloudWatch Logs with Log Insights.

- Execute CloudWatch Logs Insights queries
- List available log groups
- Get recent log entries from specific log groups
- Support for relative time ranges (e.g., "1h", "1d")
- Flexible query parameters and filtering

## Prerequisites

- Node.js >=18.0.0
- AWS credentials configured (via AWS CLI, environment variables, or IAM role)
- Access to CloudWatch Logs

```bash
# Configure AWS credentials (pick one method):

# Option 1: AWS CLI
aws configure

# Option 2: Environment variables
export aws_access_key_id=your_key
export aws_secret_access_key=your_secret
export AWS_REGION=us-east-1

# Verify credentials
aws sts get-caller-identity
```

## Setup

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add cloudwatch --scope user -- npx --yes @teolin/mcp-cloudwatch-logs
gemini mcp add cloudwatch npx --yes @teolin/mcp-cloudwatch-logs

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-cloudwatch-logs
claude mcp add cloudwatch --scope user -- cloudwatch-mcp
gemini mcp add cloudwatch cloudwatch-mcp

# Option 3: Local project
npm install @teolin/mcp-cloudwatch-logs
claude mcp add cloudwatch --scope project -- node ./node_modules/@teolin/mcp-cloudwatch-logs/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
claude mcp remove cloudwatch --scope user
gemini mcp remove cloudwatch
```

---

## Available Tools

### 1. query_logs
Execute CloudWatch Logs Insights queries.

**Parameters:**
- `query` (string, required): Logs Insights query string
- `logGroups` (array, required): Log group names to query
- `startTime` (string): Start time (ISO 8601 or relative like "1h", "1d")
- `endTime` (string): End time (ISO 8601 or "now")
- `limit` (number): Maximum number of results (default: 100)

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

## Usage Examples

### Example 1: Query recent errors
```javascript
// In Claude Code:
"Show me errors from the last hour in /aws/lambda/my-function"
// Uses: query_logs with filter pattern for ERROR
```

### Example 2: Search specific log group
```javascript
// In Claude Code:
"Query CloudWatch: fields @timestamp, @message | filter @message like /timeout/ | sort @timestamp desc"
// Custom Logs Insights query
```

### Example 3: List all log groups
```javascript
// In Claude Code:
"List all CloudWatch log groups starting with /aws/lambda"
// Uses: list_log_groups with namePrefix filter
```

### Example 4: Get recent logs from specific group
```javascript
// In Claude Code:
"Get the last 50 log entries from /aws/ecs/my-service from the past 2 hours"
// Uses: get_recent_logs with hours and limit parameters
```
