# Kafdrop MCP Server

> **DISABLED — this server does not work yet.** It is excluded from the setup, register and test
> scripts, and its package is marked private so it cannot be published. The last published version
> (3.3.6) is still on npm but is not maintained. The commands below are kept for when it is fixed.

## Features

Model Context Protocol (MCP) server for inspecting and managing Kafka clusters via Kafdrop Web UI.

- **List Topics**: View all Kafka topics in the cluster
- **Topic Details**: Get detailed information about partitions, replicas, and configuration
- **Browse Messages**: Read messages from specific topic partitions
- **Consumer Groups**: Monitor consumer groups and their lag
- **Broker Information**: List all Kafka brokers in the cluster
- **Message Search**: Search for messages containing specific text

## Prerequisites

- Node.js >=18.0.0
- A running Kafdrop instance (v2.0.0+ recommended)
- Kafdrop accessible via HTTP/HTTPS

```bash
# Setup environment
cp .env.example .env
# Add:
#   KAFDROP_URL=http://localhost:9000
#   KAFDROP_API_TIMEOUT=30000
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
claude mcp add kafdrop --scope user -- npx --yes @teolin/mcp-kafdrop
gemini mcp add kafdrop npx --yes @teolin/mcp-kafdrop
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add kafdrop --scope user --env KAFDROP_URL=http://localhost:9000 -- npx --yes @teolin/mcp-kafdrop
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-kafdrop
claude mcp add kafdrop --scope user -- kafdrop-mcp
gemini mcp add kafdrop kafdrop-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-kafdrop
claude mcp add kafdrop --scope project -- node ./node_modules/@teolin/mcp-kafdrop/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/Kafdrop
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add kafdrop --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-kafdrop` for `kafdrop-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "kafdrop": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-kafdrop"],
      "env": { "KAFDROP_URL": "http://localhost:9000" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add kafdrop --env KAFDROP_URL=http://localhost:9000 -- npx --yes @teolin/mcp-kafdrop
```

```toml
[mcp_servers.kafdrop]
command = "npx"
args = ["--yes", "@teolin/mcp-kafdrop"]

[mcp_servers.kafdrop.env]
KAFDROP_URL = "http://localhost:9000"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add kafdrop -- npx --yes @teolin/mcp-kafdrop
```

```json
{
  "mcpServers": {
    "kafdrop": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-kafdrop"],
      "env": { "KAFDROP_URL": "http://localhost:9000" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  kafdrop:
    type: stdio
    name: kafdrop
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-kafdrop"]
    envs: { KAFDROP_URL: "http://localhost:9000" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove kafdrop --scope user
gemini mcp remove kafdrop
```

---

## Available Tools

### 1. list_topics
Lists all Kafka topics in the cluster.

### 2. get_topic_details
Get detailed information about a specific topic. Parameters: `topic_name` (required).

### 3. browse_messages
Browse messages from a topic partition. Parameters: `topic_name` (required), `partition` (required), `offset`, `limit` (default: 10), `format` (json/text/avro/protobuf).

### 4. list_consumer_groups
Lists all consumer groups in the cluster.

### 5. get_consumer_group_details
Get consumer group lag and offset information. Parameters: `group_id` (required).

### 6. list_brokers
Lists all Kafka brokers in the cluster.

### 7. search_messages
Search for messages containing specific text. Parameters: `topic_name` (required), `search_term` (required), `partition`, `max_results` (default: 50).

## Usage Examples

### Example 1: List topics
```javascript
// In Claude Code:
"Show me all Kafka topics in the cluster"
// Lists available topics
```

### Example 2: Browse messages
```javascript
// In Claude Code:
"Show me recent messages from the user-events topic, partition 0"
// Uses: browse_messages with limit
```

### Example 3: Search messages
```javascript
// In Claude Code:
"Search for messages containing 'error' in the logs topic"
// Searches across partitions
```

### Example 4: Consumer groups
```javascript
// In Claude Code:
"Show me consumer group lag for all groups"
// Returns lag information
```
