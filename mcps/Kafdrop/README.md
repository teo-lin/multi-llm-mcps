# Kafdrop MCP Server

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

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add kafdrop --scope user -- npx --yes @teolin/mcp-kafdrop
gemini mcp add kafdrop npx --yes @teolin/mcp-kafdrop

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-kafdrop
claude mcp add kafdrop --scope user -- kafdrop-mcp
gemini mcp add kafdrop kafdrop-mcp

# Option 3: Local project
npm install @teolin/mcp-kafdrop
claude mcp add kafdrop --scope project -- node ./node_modules/@teolin/mcp-kafdrop/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
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
