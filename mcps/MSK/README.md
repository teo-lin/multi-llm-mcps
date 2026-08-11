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

## Setup

Four ways to run this server. Pick one:

| Setup            | What it does                                   | Use it when                                | How to                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| _none (npx)_     | Downloads and runs on demand, nothing kept     | Trying it out, or always want latest       |                                                   |
| _global (npm)_   | Installs once, runs from disk, offline         | Fastest start, works offline, all projects | `npm install --global @teolin/mcp-msk`                     |
| _local (npm)_    | Install per project / repository, runs offline | Fast, offline, Project/team specific       | `npm install @teolin/mcp-msk`                              |
| _custom (clone)_ | Runs your own source copy                      | You want to change the server code         | `git clone https://github.com/teo-lin/multi-llm-mcps.git && cd multi-llm-mcps && npm run setup` |

### Usage

Once installed, the server must be registered with your preferred agent(s), so the agent(s) can use it. Pick the relevant one(s) for you.

```bash
# no setup (npx):
claude mcp add msk --scope user -- npx --yes @teolin/mcp-msk
gemini mcp add msk npx --yes @teolin/mcp-msk
codex  mcp add msk -- npx --yes @teolin/mcp-msk
devin  mcp add msk --scope user -- npx --yes @teolin/mcp-msk

# global setup (npm --global): same commands, with the binary instead of npx
claude mcp add msk --scope user -- msk-mcp
gemini mcp add msk msk-mcp
codex  mcp add msk -- msk-mcp
devin  mcp add msk --scope user -- msk-mcp

# local setup (npm, one project): point at the installed file
claude mcp add msk --scope project -- node ./node_modules/@teolin/mcp-msk/src/index.js

# custom (clone): register every server in this repo, from the repo root
bash scripts/register-all.sh
# or register just this one, from mcps/MSK:
claude mcp add msk --scope user -- "$PWD/start-mcp.sh"
gemini mcp add msk --scope user "$PWD/start-mcp.sh"
codex  mcp add msk -- "$PWD/start-mcp.sh"
devin  mcp add msk --scope user -- "$PWD/start-mcp.sh"
```

`npx` and global installs do not read this folder's `.env` — pass config on the command line:

```bash
claude mcp add msk --scope user --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-msk
gemini mcp add msk --scope user -e AWS_REGION=eu-central-1 npx --yes @teolin/mcp-msk
codex  mcp add msk --env AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-msk
devin  mcp add msk --scope user -e AWS_REGION=eu-central-1 -- npx --yes @teolin/mcp-msk
```

The clone setup needs none of this: `start-mcp.sh` loads `.env` for you.

### Verify and remove

```bash
claude mcp list
gemini mcp list
codex  mcp list
devin  mcp list

claude mcp remove msk --scope user
gemini mcp remove msk --scope user
codex  mcp remove msk
devin  mcp remove msk --scope user
```

`claude mcp get msk`, `codex mcp get msk` and `devin mcp get msk` show one server in
detail. `devin` removes from `local` scope unless you pass `--scope`, so remove from the same scope
you added to.

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
