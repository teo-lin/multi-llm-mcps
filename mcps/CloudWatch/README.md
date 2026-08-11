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

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-cloudwatch-logs`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-cloudwatch-logs`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add cloudwatch --scope user -- npx --yes @teolin/mcp-cloudwatch-logs
gemini mcp add cloudwatch npx --yes @teolin/mcp-cloudwatch-logs
codex  mcp add cloudwatch -- npx --yes @teolin/mcp-cloudwatch-logs
devin  mcp add cloudwatch --scope user -- npx --yes @teolin/mcp-cloudwatch-logs

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add cloudwatch --scope user -- cloudwatch-mcp
gemini mcp add cloudwatch cloudwatch-mcp
codex  mcp add cloudwatch -- cloudwatch-mcp
devin  mcp add cloudwatch --scope user -- cloudwatch-mcp

# local setup (npm, one project): point at the installed file
claude mcp add cloudwatch --scope project -- node ./node_modules/@teolin/mcp-cloudwatch-logs/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/CloudWatch:
claude mcp add cloudwatch --scope user -- "$PWD/start-mcp.sh"
gemini mcp add cloudwatch --scope user "$PWD/start-mcp.sh"
codex  mcp add cloudwatch -- "$PWD/start-mcp.sh"
devin  mcp add cloudwatch --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add cloudwatch --scope user --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-cloudwatch-logs
gemini mcp add cloudwatch --scope user -e AWS_REGION=eu-central-1 npx --yes @teolin/mcp-cloudwatch-logs
codex  mcp add cloudwatch --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-cloudwatch-logs
devin  mcp add cloudwatch --scope user -e AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-cloudwatch-logs
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove cloudwatch --scope user
gemini mcp remove cloudwatch --scope user
codex  mcp remove cloudwatch
devin  mcp remove cloudwatch --scope user
```

`claude mcp get cloudwatch`, `codex mcp get cloudwatch` and `devin mcp get cloudwatch` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
