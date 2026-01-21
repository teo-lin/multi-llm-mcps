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

- Node.js >=18.0.0
- A running Kafdrop instance (v2.0.0+ recommended for full API support)
- Kafdrop accessible via HTTP/HTTPS

## Installation

---

### Option 1: Using npx (No Installation)

#### Setup

```bash
# Either User scope (available in all projects)
claude mcp add kafdrop -s user -- npx -y @teolin/mcp-kafdrop

# Or Project scope (shared with team via git)
claude mcp add kafdrop -s project -- npx -y @teolin/mcp-kafdrop
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `npx -y @teolin/mcp-kafdrop` on start)

---

### Option 2: Global npm Installation

#### Setup

```bash
npm install -g @teolin/mcp-kafdrop

# Either User scope (available in all projects)
claude mcp add kafdrop -s user -- kafdrop-mcp

# Or Project scope (shared with team via git)
claude mcp add kafdrop -s project -- kafdrop-mcp
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `kafdrop-mcp` on start)

---

### Option 3: Local Installation

#### Setup

```bash
npm install @teolin/mcp-kafdrop

# Either User scope (available in all projects)
claude mcp add kafdrop -s user -- node ./node_modules/@teolin/mcp-kafdrop/src/index.js

# Or Project scope (shared with team via git)
claude mcp add kafdrop -s project -- node ./node_modules/@teolin/mcp-kafdrop/src/index.js
```

#### Usage
Automatic. Claude will use it when needed. (Startup managed by Claude MCP server lifecycle - it simply runs `node ./node_modules/@teolin/mcp-kafdrop/src/index.js` on start)

---

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

- `KAFDROP_URL`: URL of your Kafdrop instance (default: `http://localhost:9000`)
- `KAFDROP_API_TIMEOUT`: API request timeout in milliseconds (default: `30000`)

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

## Troubleshooting

### Cannot connect to Kafdrop
- Ensure Kafdrop is running and accessible at the configured URL
- Check firewall settings
- Verify the URL in your `.env` file

### API Timeout Errors
- Increase `KAFDROP_API_TIMEOUT` for large message queries
- Check Kafka cluster performance

## Publishing

### Using GitHub Actions (Recommended)

This package uses GitHub Actions for automated publishing. To publish a new version:

1. Go to GitHub Actions → "Publish @teolin/mcp-kafdrop" → Run workflow
2. The workflow will automatically:
   - Install dependencies
   - Run the `prepublishOnly` script to make the bin executable
   - Publish to npm with public access

### Manual Publishing

#### Prerequisites

1. You need an npm account: https://www.npmjs.com/signup
2. Login to npm:
   ```bash
   npm login
   ```

#### Publishing Steps

1. **Test the package locally** (optional but recommended):
   ```bash
   # Test that it runs
   node src/index.js --help

   # Or test with environment variables
   KAFDROP_URL=http://localhost:9000 node src/index.js
   ```

2. **Publish to npm**:
   ```bash
   npm publish
   ```

   This will:
   - Run the `prepublishOnly` script to make the bin executable
   - Only include files specified in the `files` field
   - Publish to npm with public access (configured in `publishConfig`)

3. **Verify the package**:
   ```bash
   # Test with npx (no installation)
   npx -y @teolin/mcp-kafdrop

   # Or install globally and test
   npm install -g @teolin/mcp-kafdrop
   kafdrop-mcp
   ```

#### Updating the Package

1. Update the version in `package.json`:
   ```bash
   npm version patch  # for bug fixes (2.0.2 -> 2.0.3)
   npm version minor  # for new features (2.0.2 -> 2.1.0)
   npm version major  # for breaking changes (2.0.2 -> 3.0.0)
   ```

2. Publish the new version:
   ```bash
   npm publish
   ```

#### Checking Published Package

View your package on npm:
- https://www.npmjs.com/package/@teolin/mcp-kafdrop

Check what files will be included before publishing:
```bash
npm pack --dry-run
```

#### Troubleshooting

**"You do not have permission to publish"**
- Make sure you're logged in: `npm whoami`
- For scoped packages (@teolin/...), ensure you have access to the @teolin organization or use your own scope

**"Package name already exists"**
- The package name might be taken. Check: https://www.npmjs.com/package/@teolin/mcp-kafdrop
- If needed, change the name in package.json

**Files missing after installation**
- Check the `files` field in package.json
- Use `npm pack --dry-run` to preview what will be included

## Usage Examples

### Example 1: List all Kafka topics
```javascript
// In Claude Code:
"List all topics in Kafka"
// Uses: list_topics
```

### Example 2: Get topic details
```javascript
// In Claude Code:
"Show me details for topic user-events"
// Uses: get_topic_details with topic_name
```

### Example 3: Browse messages
```javascript
// In Claude Code:
"Show me the last 10 messages from topic user-events partition 0"
// Uses: browse_messages with limit parameter
```

### Example 4: Search messages
```javascript
// In Claude Code:
"Search for 'user123' in topic activity-logs"
// Uses: search_messages with search_term
```

### Example 5: Check consumer lag
```javascript
// In Claude Code:
"Show me consumer group 'my-app-group' lag"
// Uses: get_consumer_group_details
```

## Requirements

- Node.js >=18.0.0
- Kafdrop running and accessible
- Published on npm: [@teolin/mcp-kafdrop](https://www.npmjs.com/package/@teolin/mcp-kafdrop)

## License

MIT
