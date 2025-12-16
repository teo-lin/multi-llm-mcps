# Kafdrop MCP Server

Model Context Protocol (MCP) server for inspecting and managing Kafka clusters via Kafdrop Web UI.

## Features

- **List Topics**: View all Kafka topics in the cluster
- **Topic Details**: Get detailed information about partitions, replicas, and configuration
- **Browse Messages**: Read messages from specific topic partitions
- **Consumer Groups**: Monitor consumer groups and their lag
- **Broker Information**: List all Kafka brokers in the cluster
- **Message Search**: Search for messages containing specific text

## Prerequisites

- Node.js >=25.2.1
- A running Kafdrop instance (v2.0.0+ recommended for full API support)
- Kafdrop accessible via HTTP/HTTPS

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

- `KAFDROP_URL`: URL of your Kafdrop instance (default: `http://localhost:9000`)
- `KAFDROP_API_TIMEOUT`: API request timeout in milliseconds (default: `30000`)

## Usage

### Starting the Server

```bash
npm start
```

### Running Tests

```bash
npm test
```

## Available Tools

### 1. list_topics
Lists all Kafka topics in the cluster.

### 2. get_topic_details
Get detailed information about a specific topic.
- **Parameters**: `topic_name` (string)

### 3. browse_messages
Browse messages from a topic partition.
- **Parameters**:
  - `topic_name` (string, required)
  - `partition` (number, required)
  - `offset` (number, optional)
  - `limit` (number, default: 10)
  - `format` (json/text/avro/protobuf, default: json)

### 4. list_consumer_groups
Lists all consumer groups in the cluster.

### 5. get_consumer_group_details
Get consumer group lag and offset information.
- **Parameters**: `group_id` (string)

### 6. list_brokers
Lists all Kafka brokers in the cluster.

### 7. search_messages
Search for messages containing specific text.
- **Parameters**:
  - `topic_name` (string, required)
  - `search_term` (string, required)
  - `partition` (number, optional)
  - `max_results` (number, default: 50)

## Integration with Claude Code

Claude Code supports three scopes for MCP server configuration:

- **User scope** (`~/.claude.json`): Available across all projects
- **Local scope** (`~/.claude.json`): Project-specific, private to you (default)
- **Project scope** (`.mcp.json` in project root): Team-shared, committed to git

### Quick Setup with CLI (Recommended)

```bash
# User scope (available in all projects)
claude mcp add kafdrop --scope user

# Project scope (shared with team via git)
claude mcp add kafdrop --scope project
```

### Manual Configuration

#### Using npx (Recommended - no installation needed)

Add to `.mcp.json` (project scope) or `~/.claude.json` (user scope):

```json
{
  "mcpServers": {
    "kafdrop": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "kafdrop-mcp-server"],
      "env": {
        "KAFDROP_URL": "http://localhost:9000"
      }
    }
  }
}
```

#### Using global installation

```json
{
  "mcpServers": {
    "kafdrop": {
      "type": "stdio",
      "command": "kafdrop-mcp",
      "env": {
        "KAFDROP_URL": "http://localhost:9000"
      }
    }
  }
}
```

#### Using local installation

```json
{
  "mcpServers": {
    "kafdrop": {
      "type": "stdio",
      "command": "node",
      "args": [
        "./node_modules/kafdrop-mcp-server/src/index.js"
      ],
      "env": {
        "KAFDROP_URL": "http://localhost:9000"
      }
    }
  }
}
```

## Troubleshooting

### Cannot connect to Kafdrop
- Ensure Kafdrop is running and accessible at the configured URL
- Check firewall settings
- Verify the URL in your `.env` file

### API Timeout Errors
- Increase `KAFDROP_API_TIMEOUT` for large message queries
- Check Kafka cluster performance

## Requirements

- Node.js >=25.2.1
- Kafdrop running and accessible
- Published on npm: [kafdrop-mcp-server](https://www.npmjs.com/package/kafdrop-mcp-server)

## License

MIT
