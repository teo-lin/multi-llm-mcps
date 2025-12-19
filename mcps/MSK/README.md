# AWS MSK MCP Server

MCP server for AWS MSK (Managed Streaming for Kafka) with protobuf message decoding.

## Features

- 🔍 **Browse Kafka Messages** - Read messages from specific partitions and offsets
- 🔎 **Search Messages** - Search across partitions for specific content
- 📋 **List Clusters & Topics** - Discover MSK clusters and Kafka topics
- 🔐 **Protobuf Decoding** - Decode messages using `@doctaridev/io.planer.library.npm.protobuf`
- ☁️ **AWS Integration** - Seamless integration with AWS MSK API
- 🛡️ **Multiple Auth Methods** - Support for IAM, TLS, and plaintext authentication

## Tools

### 1. `list_clusters`
List all MSK clusters in your AWS region.

**Parameters:**
- `maxResults` (number, optional): Maximum clusters to return (default: 50)
- `clusterNameFilter` (string, optional): Filter by cluster name

**Example:**
```json
{
  "name": "list_clusters",
  "arguments": {
    "maxResults": 10
  }
}
```

### 2. `get_cluster_details`
Get detailed information about a specific MSK cluster.

**Parameters:**
- `clusterArn` (string, required): ARN of the MSK cluster

**Example:**
```json
{
  "name": "get_cluster_details",
  "arguments": {
    "clusterArn": "arn:aws:kafka:us-east-1:123456789:cluster/my-cluster/abc-123"
  }
}
```

### 3. `list_topics`
List all topics in a Kafka cluster.

**Parameters:**
- `clusterArn` (string, required): ARN of the MSK cluster

### 4. `get_topic_metadata`
Get partition and metadata information for a topic.

**Parameters:**
- `clusterArn` (string, required): ARN of the MSK cluster
- `topicName` (string, required): Name of the topic

### 5. `browse_messages`
Browse messages from a specific partition/offset.

**Parameters:**
- `clusterArn` (string, required): ARN of the MSK cluster
- `topicName` (string, required): Name of the topic
- `partition` (number, required): Partition number
- `offset` (number, optional): Starting offset
- `limit` (number, optional): Max messages to retrieve (default: 10, max: 100)
- `decodeProtobuf` (boolean, optional): Decode as protobuf (default: false)
- `messageType` (string, optional): Protobuf message type (required if decodeProtobuf=true)

**Example:**
```json
{
  "name": "browse_messages",
  "arguments": {
    "clusterArn": "arn:aws:kafka:...",
    "topicName": "my-topic",
    "partition": 0,
    "limit": 10,
    "decodeProtobuf": true,
    "messageType": "UserAvailabilityException"
  }
}
```

### 6. `search_messages`
Search for messages containing specific text.

**Parameters:**
- `clusterArn` (string, required): ARN of the MSK cluster
- `topicName` (string, required): Name of the topic
- `searchTerm` (string, required): Text to search for
- `partition` (number, optional): Specific partition to search
- `maxResults` (number, optional): Max results (default: 50, max: 200)
- `decodeProtobuf` (boolean, optional): Decode as protobuf
- `messageType` (string, optional): Protobuf message type

### 7. `list_protobuf_types`
List all available protobuf message types.

**Example:**
```json
{
  "name": "list_protobuf_types",
  "arguments": {}
}
```

## Installation

### Prerequisites

- Node.js >= 25.2.1
- AWS credentials with MSK permissions
- Access to MSK cluster (VPN/Direct Connect if in VPC)

### Install from npm

```bash
npm install -g @teolin/mcp-msk
```

### Install locally

```bash
cd mcps/MSK
npm install
```

## Configuration

Create a `.env` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# MSK Authentication (TLS, IAM, or PLAINTEXT)
MSK_AUTH_TYPE=TLS

# Kafka Connection (optional)
KAFKA_CONNECTION_TIMEOUT=30000
KAFKA_REQUEST_TIMEOUT=30000
```

## Register with Claude Code

```bash
# Using start script
claude mcp add msk /path/to/mcps/MSK/start-mcp.sh --scope user

# Using npx
claude mcp add msk --scope user --type stdio \
  --command npx --args "-y,@teolin/mcp-msk" \
  --env "AWS_REGION=us-east-1,MSK_AUTH_TYPE=TLS"
```

## IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kafka:ListClustersV2",
        "kafka:DescribeClusterV2",
        "kafka:GetBootstrapBrokers"
      ],
      "Resource": "arn:aws:kafka:*:*:cluster/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kafka-cluster:Connect",
        "kafka-cluster:DescribeTopic",
        "kafka-cluster:ReadData"
      ],
      "Resource": [
        "arn:aws:kafka:*:*:cluster/*",
        "arn:aws:kafka:*:*:topic/*/*/*"
      ]
    }
  ]
}
```

## Protobuf Decoding

The server uses `@doctaridev/io.planer.library.npm.protobuf` for message decoding.

### Available Message Types

Use `list_protobuf_types` to see all available types. Common types include:
- `UserAvailabilityException`
- `GenericAbsencePeriod`
- `Customer`
- `User`
- `Envelope`

### Decoding Workflow

1. **List types**: Call `list_protobuf_types` to see available message types
2. **Browse with decode**: Call `browse_messages` with `decodeProtobuf=true` and specify `messageType`
3. **Handle errors**: If decoding fails, raw base64 data is returned with error message

## Network Requirements

### MSK Cluster Access

MSK clusters run in VPC. You need one of:
1. Run MCP server in same VPC (EC2, ECS)
2. VPN or Direct Connect from local machine
3. Public access enabled on MSK cluster
4. Bastion host / SSH tunnel

### Ports

- **9094**: TLS encrypted (default)
- **9092**: Plaintext
- **9096**: IAM authentication

### Security Groups

MSK cluster security group must allow inbound traffic from MCP server IP on port 9094.

## Testing

```bash
npm test
```

## Troubleshooting

### Connection Errors

- **Issue**: Cannot connect to MSK cluster
- **Solution**: Check security groups, verify network access, ensure brokers are reachable

### Authentication Errors

- **Issue**: Access denied or authentication failed
- **Solution**: Verify AWS credentials, check IAM permissions, ensure MSK_AUTH_TYPE matches cluster configuration

### Protobuf Decode Errors

- **Issue**: Failed to decode message
- **Solution**: Use `list_protobuf_types` to verify message type name, check that messages are actually protobuf-encoded

## Examples

### Browse Latest Messages

```javascript
{
  "name": "browse_messages",
  "arguments": {
    "clusterArn": "arn:aws:kafka:us-east-1:123456789:cluster/my-cluster/abc-123",
    "topicName": "user-events",
    "partition": 0,
    "limit": 10
  }
}
```

### Search for Specific User

```javascript
{
  "name": "search_messages",
  "arguments": {
    "clusterArn": "arn:aws:kafka:us-east-1:123456789:cluster/my-cluster/abc-123",
    "topicName": "user-events",
    "searchTerm": "user123",
    "maxResults": 50
  }
}
```

### Decode Protobuf Messages

```javascript
{
  "name": "browse_messages",
  "arguments": {
    "clusterArn": "arn:aws:kafka:us-east-1:123456789:cluster/my-cluster/abc-123",
    "topicName": "absence-events",
    "partition": 0,
    "decodeProtobuf": true,
    "messageType": "UserAvailabilityException",
    "limit": 10
  }
}
```

## License

MIT

## Repository

https://github.com/teo-lin/multi-llm-mcps
