# AWS MSK MCP Server

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

| Method         | Pros                          | Cons                             | When           |
| -------------- | ----------------------------- | -------------------------------- | -------------- |
| **npx**        | No install, latest version    | Slower, needs internet           | Quick demos    |
| **Global npm** | Instant, offline              | Takes disk space, manual updates | Default choice |
| **Local npm**  | Version controlled, team sync | Extra disk per project           | Shared teams   |

```bash
# Option 1: npx (fastest)
claude mcp add msk --scope user -- npx --yes @teolin/mcp-msk
gemini mcp add msk npx --yes @teolin/mcp-msk

# Option 2: Global install (recommended)
npm install --global @teolin/mcp-msk
claude mcp add msk --scope user -- msk-mcp
gemini mcp add msk msk-mcp

# Option 3: Local project
npm install @teolin/mcp-msk
claude mcp add msk --scope project -- node ./node_modules/@teolin/mcp-msk/src/index.js

# Verify
claude mcp list
gemini mcp list

# Remove
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
