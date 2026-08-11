# AWS MSK MCP Server

> **DISABLED — this server does not work yet.** It is excluded from the setup, register and test
> scripts, and its package is marked private so it cannot be published. `@teolin/mcp-msk` has never
> been published, so the npx and npm commands below will fail until it is fixed and released.

## Features

MCP server for AWS MSK (Managed Streaming for Kafka) with protobuf message decoding.

- **Browse Kafka Messages**: Read messages from specific partitions and offsets
- **Search Messages**: Search across partitions for specific content
- **List Clusters & Topics**: Discover MSK clusters and Kafka topics
- **Protobuf Decoding**: Decode messages using protobuf
- **AWS Integration**: Seamless integration with AWS MSK API
- **Multiple Auth Methods**: Support for IAM, TLS, and plaintext authentication

## Prerequisites

- Node.js >=25.2.1
- AWS credentials with MSK permissions
- Access to MSK cluster (VPN/Direct Connect if in VPC)

```bash
# Setup environment
cp .env.example .env
# Add AWS credentials:
#   AWS_REGION=us-east-1
#   AWS_ACCESS_KEY_ID=your_key
#   AWS_SECRET_ACCESS_KEY=your_secret

# MSK Authentication (optional):
#   MSK_AUTH_TYPE=TLS  # TLS, IAM, or PLAINTEXT
#   KAFKA_CONNECTION_TIMEOUT=30000
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
claude mcp add msk --scope user -- npx --yes @teolin/mcp-msk
gemini mcp add msk npx --yes @teolin/mcp-msk
```

This server reads its config from environment variables. `npx` and global installs do not see
this folder's `.env`, so pass them on the command line:

```bash
claude mcp add msk --scope user --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-msk
```

### npm install

Installed once, so startup is instant and works offline. You update it yourself with `npm update`.

```bash
# Global — available in every project (recommended)
npm install --global @teolin/mcp-msk
claude mcp add msk --scope user -- msk-mcp
gemini mcp add msk msk-mcp

# Local — pinned to one project, shared with your team through package.json
npm install @teolin/mcp-msk
claude mcp add msk --scope project -- node ./node_modules/@teolin/mcp-msk/src/index.js
```

### clone repo

Runs the source directly, so your edits take effect at the next restart. Needed for unpublished changes.

```bash
git clone https://github.com/teo-lin/multi-llm-mcps.git
cd multi-llm-mcps/mcps/MSK
npm install
cp .env.example .env   # then fill it in — start-mcp.sh loads it for you
claude mcp add msk --scope user -- "$PWD/start-mcp.sh"
```

### Other agents

Same three methods apply — only the registration command changes. Each example below uses npx; for
**npm install** swap `npx --yes @teolin/mcp-msk` for `msk-mcp`, and for **clone repo** swap it for the absolute
path to `start-mcp.sh`.

**GitHub Copilot CLI** — `copilot mcp add`, or `/mcp add` inside a session, or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "msk": {
      "type": "local",
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-msk"],
      "env": { "AWS_REGION": "eu-central-1" },
      "tools": ["*"]
    }
  }
}
```

**OpenAI Codex CLI** — one command, or edit `~/.codex/config.toml`:

```bash
codex mcp add msk --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-msk
```

```toml
[mcp_servers.msk]
command = "npx"
args = ["--yes", "@teolin/mcp-msk"]

[mcp_servers.msk.env]
AWS_REGION = "eu-central-1"
```

**Devin** — one command, or edit `.devin/mcp_config.json` (put secrets in the gitignored `.devin/mcp_config.local.json`):

```bash
devin mcp add msk -- npx --yes @teolin/mcp-msk
```

```json
{
  "mcpServers": {
    "msk": {
      "command": "npx",
      "args": ["--yes", "@teolin/mcp-msk"],
      "env": { "AWS_REGION": "eu-central-1" }
    }
  }
}
```

**Goose** — `goose configure` → *Add Extension* → *Command-line Extension*, or edit `~/.config/goose/config.yaml`:

```yaml
extensions:
  msk:
    type: stdio
    name: msk
    enabled: true
    cmd: npx
    args: ["--yes", "@teolin/mcp-msk"]
    envs: { AWS_REGION: "eu-central-1" }
    timeout: 300
```

### Verify and remove

```bash
claude mcp list
gemini mcp list

claude mcp remove msk --scope user
gemini mcp remove msk
```

---

## Available Tools

### 1. list_clusters
List all MSK clusters in your AWS region. Parameters: `maxResults`, `clusterNameFilter`.

### 2. get_cluster_details
Get detailed information about a specific MSK cluster. Parameters: `clusterArn` (required).

### 3. list_topics
List all topics in a Kafka cluster. Parameters: `clusterArn` (required).

### 4. get_topic_metadata
Get partition and metadata information for a topic. Parameters: `clusterArn` (required), `topicName` (required).

### 5. browse_messages
Browse messages from a specific partition/offset. Parameters: `clusterArn` (required), `topicName` (required), `partition` (required), `offset`, `limit` (default: 10), `decodeProtobuf`, `messageType`.

### 6. search_messages
Search for messages containing specific text. Parameters: `clusterArn` (required), `topicName` (required), `searchTerm` (required), `partition`, `maxResults` (default: 50), `decodeProtobuf`, `messageType`.

### 7. list_protobuf_types
List all available protobuf message types.

## Usage Examples

### Example 1: List clusters
```javascript
// In Claude Code:
"Show me all MSK clusters in my AWS region"
// Lists available MSK clusters
```

### Example 2: Browse messages
```javascript
// In Claude Code:
"Show me messages from my-topic partition 0 with protobuf decoding"
// Decodes protobuf messages
```

### Example 3: Search messages
```javascript
// In Claude Code:
"Search for messages containing 'error' in the events topic"
// Returns matching messages
```

### Example 4: Topic metadata
```javascript
// In Claude Code:
"Get partition info for the orders topic"
// Returns metadata and partition details
```
