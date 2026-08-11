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
claude mcp add cloudwatch --scope user -- npx --yes @teolin/mcp-cloudwatch-logs
gemini mcp add cloudwatch npx --yes @teolin/mcp-cloudwatch-logs
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add cloudwatch --scope user --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-cloudwatch-logs
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-cloudwatch-logs
claude mcp add cloudwatch --scope user -- cloudwatch-mcp
gemini mcp add cloudwatch cloudwatch-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-cloudwatch-logs
claude mcp add cloudwatch --scope project -- node ./node_modules/@teolin/mcp-cloudwatch-logs/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/CloudWatch
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add cloudwatch --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-cloudwatch-logs` for `cloudwatch-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "cloudwatch": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-cloudwatch-logs"],
      "env": { "AWS_REGION": "eu-central-1" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add cloudwatch --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-cloudwatch-logs
```

```toml
[mcp_servers.cloudwatch]
command = "npx"
args = ["--yes", "@teolin/mcp-cloudwatch-logs"]

[mcp_servers.cloudwatch.env]
AWS_REGION = "eu-central-1"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add cloudwatch -- npx --yes @teolin/mcp-cloudwatch-logs
```

```json
{
  "mcpServers": {
    "cloudwatch": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-cloudwatch-logs"],
      "env": { "AWS_REGION": "eu-central-1" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  cloudwatch:
    type: stdio
    name: cloudwatch
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-cloudwatch-logs"]
    envs: { AWS_REGION: "eu-central-1" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

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
