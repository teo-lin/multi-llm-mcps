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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-kafdrop`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-kafdrop`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add kafdrop --scope user -- npx --yes @teolin/mcp-kafdrop
gemini mcp add kafdrop npx --yes @teolin/mcp-kafdrop
codex  mcp add kafdrop -- npx --yes @teolin/mcp-kafdrop
devin  mcp add kafdrop --scope user -- npx --yes @teolin/mcp-kafdrop

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add kafdrop --scope user -- kafdrop-mcp
gemini mcp add kafdrop kafdrop-mcp
codex  mcp add kafdrop -- kafdrop-mcp
devin  mcp add kafdrop --scope user -- kafdrop-mcp

# local setup (npm, one project): point at the installed file
claude mcp add kafdrop --scope project -- node ./node_modules/@teolin/mcp-kafdrop/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/Kafdrop:
claude mcp add kafdrop --scope user -- "$PWD/start-mcp.sh"
gemini mcp add kafdrop --scope user "$PWD/start-mcp.sh"
codex  mcp add kafdrop -- "$PWD/start-mcp.sh"
devin  mcp add kafdrop --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add kafdrop --scope user --env KAFDROP_URL=http://localhost:9000 -- npx --yes @teolin/mcp-kafdrop
gemini mcp add kafdrop --scope user -e KAFDROP_URL=http://localhost:9000 npx --yes @teolin/mcp-kafdrop
codex  mcp add kafdrop --env KAFDROP_URL=http://localhost:9000 -- npx --yes @teolin/mcp-kafdrop
devin  mcp add kafdrop --scope user -e KAFDROP_URL=http://localhost:9000 -- npx --yes @teolin/mcp-kafdrop
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove kafdrop --scope user
gemini mcp remove kafdrop --scope user
codex  mcp remove kafdrop
devin  mcp remove kafdrop --scope user
```

`claude mcp get kafdrop`, `codex mcp get kafdrop` and `devin mcp get kafdrop` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
