# CloudWatch Logs MCP Server

An MCP (Model Context Protocol) server for querying AWS CloudWatch Logs using Log Insights.

## Features

- **Query Logs**: Execute CloudWatch Logs Insights queries with flexible time ranges
- **List Log Groups**: Browse available log groups with filtering
- **Get Recent Logs**: Quick access to recent log entries from specific log groups

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure AWS credentials using one of these methods:
   - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
   - AWS CLI configuration (`~/.aws/credentials`)
   - IAM roles (when running on EC2)

## Required AWS Permissions

The server needs the following CloudWatch Logs permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:StartQuery",
        "logs:GetQueryResults"
      ],
      "Resource": "*"
    }
  ]
}
```

## Available Tools

### query_logs
Execute a CloudWatch Logs Insights query.

**Parameters:**
- `query` (required): CloudWatch Logs Insights query string
- `logGroups` (required): Array of log group names to query
- `startTime` (optional): Start time (ISO 8601 or relative like "1h", "1d")
- `endTime` (optional): End time (ISO 8601 or "now")
- `limit` (optional): Maximum number of results (default: 100)

**Example:**
```json
{
  "query": "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc",
  "logGroups": ["/aws/lambda/my-function"],
  "startTime": "2h",
  "endTime": "now",
  "limit": 50
}
```

### list_log_groups
List available CloudWatch log groups.

**Parameters:**
- `namePrefix` (optional): Filter by name prefix
- `limit` (optional): Maximum number of results (default: 50)

### get_recent_logs
Get recent log entries from a specific log group.

**Parameters:**
- `logGroup` (required): Name of the log group
- `hours` (optional): Hours to look back (default: 1)
- `limit` (optional): Maximum number of results (default: 100)
- `filterPattern` (optional): Filter pattern for log entries

## Time Format Examples

- Relative: `"1h"` (1 hour ago), `"2d"` (2 days ago), `"30m"` (30 minutes ago)
- Absolute: `"2024-01-01T10:00:00Z"`, `"2024-01-01T10:00:00-05:00"`
- Special: `"now"` (current time)

## CloudWatch Logs Insights Query Examples

```sql
-- Find errors in the last hour
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- Count log levels
fields @timestamp, @message
| filter @message like /INFO|WARN|ERROR/
| stats count() by @message
| sort count desc

-- Parse JSON logs
fields @timestamp, @message
| filter ispresent(@requestId)
| sort @timestamp desc
```