#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { MSKClient } from './msk-client.js';
import { KafkaClientManager } from './kafka-client.js';
import { ProtobufDecoder } from './protobuf-decoder.js';

/**
 * MSKMCPServer - MCP server for AWS MSK (Managed Streaming for Kafka)
 * Provides tools for browsing Kafka messages and decoding protobuf
 */
class MSKMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'msk-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize clients
    this.mskClient = new MSKClient();
    this.kafkaManager = new KafkaClientManager();
    this.protobufDecoder = new ProtobufDecoder();

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_clusters',
          description: 'List all AWS MSK (Managed Streaming for Kafka) clusters in the region',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of clusters to return (default: 50)',
                default: 50
              },
              clusterNameFilter: {
                type: 'string',
                description: 'Filter clusters by name (optional)'
              }
            }
          }
        },
        {
          name: 'get_cluster_details',
          description: 'Get detailed information about a specific MSK cluster including broker endpoints',
          inputSchema: {
            type: 'object',
            properties: {
              clusterArn: {
                type: 'string',
                description: 'ARN of the MSK cluster'
              }
            },
            required: ['clusterArn']
          }
        },
        {
          name: 'list_topics',
          description: 'List all Kafka topics in an MSK cluster',
          inputSchema: {
            type: 'object',
            properties: {
              clusterArn: {
                type: 'string',
                description: 'ARN of the MSK cluster'
              }
            },
            required: ['clusterArn']
          }
        },
        {
          name: 'get_topic_metadata',
          description: 'Get metadata about a Kafka topic including partition count, offsets, and replicas',
          inputSchema: {
            type: 'object',
            properties: {
              clusterArn: {
                type: 'string',
                description: 'ARN of the MSK cluster'
              },
              topicName: {
                type: 'string',
                description: 'Name of the Kafka topic'
              }
            },
            required: ['clusterArn', 'topicName']
          }
        },
        {
          name: 'browse_messages',
          description: 'Browse/consume messages from a Kafka topic partition with optional protobuf decoding',
          inputSchema: {
            type: 'object',
            properties: {
              clusterArn: {
                type: 'string',
                description: 'ARN of the MSK cluster'
              },
              topicName: {
                type: 'string',
                description: 'Name of the Kafka topic'
              },
              partition: {
                type: 'number',
                description: 'Partition number to read from'
              },
              offset: {
                type: 'number',
                description: 'Starting offset (optional, defaults to latest)'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of messages to retrieve (default: 10, max: 100)',
                default: 10
              },
              decodeProtobuf: {
                type: 'boolean',
                description: 'Whether to attempt protobuf decoding (default: false)',
                default: false
              },
              messageType: {
                type: 'string',
                description: 'Protobuf message type name (required if decodeProtobuf is true). Use list_protobuf_types to see available types.'
              }
            },
            required: ['clusterArn', 'topicName', 'partition']
          }
        },
        {
          name: 'search_messages',
          description: 'Search for messages containing specific text across topic partitions',
          inputSchema: {
            type: 'object',
            properties: {
              clusterArn: {
                type: 'string',
                description: 'ARN of the MSK cluster'
              },
              topicName: {
                type: 'string',
                description: 'Name of the Kafka topic'
              },
              searchTerm: {
                type: 'string',
                description: 'Text to search for in messages (case-insensitive)'
              },
              partition: {
                type: 'number',
                description: 'Specific partition to search (optional, searches all if not specified)'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results (default: 50, max: 200)',
                default: 50
              },
              decodeProtobuf: {
                type: 'boolean',
                description: 'Whether to decode messages as protobuf before searching (default: false)',
                default: false
              },
              messageType: {
                type: 'string',
                description: 'Protobuf message type name (required if decodeProtobuf is true)'
              }
            },
            required: ['clusterArn', 'topicName', 'searchTerm']
          }
        },
        {
          name: 'list_protobuf_types',
          description: 'List all available protobuf message types from the loaded proto files',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'list_clusters':
            return await this.handleListClusters(request.params.arguments);
          case 'get_cluster_details':
            return await this.handleGetClusterDetails(request.params.arguments);
          case 'list_topics':
            return await this.handleListTopics(request.params.arguments);
          case 'get_topic_metadata':
            return await this.handleGetTopicMetadata(request.params.arguments);
          case 'browse_messages':
            return await this.handleBrowseMessages(request.params.arguments);
          case 'search_messages':
            return await this.handleSearchMessages(request.params.arguments);
          case 'list_protobuf_types':
            return await this.handleListProtobufTypes(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return this.formatError(request.params.name, error);
      }
    });
  }

  setupErrorHandling() {
    process.on('SIGINT', async () => {
      console.error('[MCP MSK] Received SIGINT, cleaning up...');
      await this.kafkaManager.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('[MCP MSK] Received SIGTERM, cleaning up...');
      await this.kafkaManager.cleanup();
      process.exit(0);
    });
  }

  // Tool Handlers

  async handleListClusters(args) {
    const { maxResults = 50, clusterNameFilter } = args;

    const clusters = await this.mskClient.listClusters(maxResults, clusterNameFilter);

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: list_clusters ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          count: clusters.length,
          clusters
        }, null, 2)}`
      }]
    };
  }

  async handleGetClusterDetails(args) {
    const { clusterArn } = args;

    const details = await this.mskClient.getClusterDetails(clusterArn);
    const brokers = await this.mskClient.getBootstrapBrokers(clusterArn);

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: get_cluster_details ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          cluster: details,
          bootstrapBrokers: brokers
        }, null, 2)}`
      }]
    };
  }

  async handleListTopics(args) {
    const { clusterArn } = args;

    const brokers = await this.mskClient.getBootstrapBrokers(clusterArn);
    const topics = await this.kafkaManager.listTopics(brokers, clusterArn);

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: list_topics ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          cluster: clusterArn,
          count: topics.length,
          topics
        }, null, 2)}`
      }]
    };
  }

  async handleGetTopicMetadata(args) {
    const { clusterArn, topicName } = args;

    const brokers = await this.mskClient.getBootstrapBrokers(clusterArn);
    const metadata = await this.kafkaManager.getTopicMetadata(brokers, clusterArn, topicName);

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: get_topic_metadata ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          cluster: clusterArn,
          topic: metadata
        }, null, 2)}`
      }]
    };
  }

  async handleBrowseMessages(args) {
    const {
      clusterArn,
      topicName,
      partition,
      offset,
      limit = 10,
      decodeProtobuf = false,
      messageType
    } = args;

    // Validate limit
    const actualLimit = Math.min(limit, 100);

    // Validate protobuf decoding parameters
    if (decodeProtobuf && !messageType) {
      throw new Error('messageType is required when decodeProtobuf is true. Use list_protobuf_types to see available types.');
    }

    // Get brokers and consume messages
    const brokers = await this.mskClient.getBootstrapBrokers(clusterArn);
    const rawMessages = await this.kafkaManager.browseMessages(
      brokers,
      clusterArn,
      topicName,
      partition,
      offset,
      actualLimit
    );

    // Process messages
    const messages = rawMessages.map(msg => {
      const base64Value = msg.value ? msg.value.toString('base64') : null;
      const base64Key = msg.key ? msg.key.toString('base64') : null;

      // Decode protobuf if requested
      if (decodeProtobuf && messageType && base64Value) {
        const decodeResult = this.protobufDecoder.tryDecode(base64Value, messageType);

        if (decodeResult.success) {
          return {
            offset: msg.offset,
            partition: msg.partition,
            timestamp: msg.timestamp,
            key: base64Key,
            decoded: decodeResult.data
          };
        } else {
          return {
            offset: msg.offset,
            partition: msg.partition,
            timestamp: msg.timestamp,
            key: base64Key,
            decodingError: decodeResult.error,
            suggestion: decodeResult.suggestion,
            rawValueBase64: decodeResult.rawBase64
          };
        }
      }

      // Return raw message
      return {
        offset: msg.offset,
        partition: msg.partition,
        timestamp: msg.timestamp,
        keyBase64: base64Key,
        valueBase64: base64Value,
        headers: msg.headers
      };
    });

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: browse_messages ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          cluster: clusterArn,
          topic: topicName,
          partition,
          requestedLimit: actualLimit,
          messageCount: messages.length,
          messages
        }, null, 2)}`
      }]
    };
  }

  async handleSearchMessages(args) {
    const {
      clusterArn,
      topicName,
      searchTerm,
      partition,
      maxResults = 50,
      decodeProtobuf = false,
      messageType
    } = args;

    // Validate maxResults
    const actualMaxResults = Math.min(maxResults, 200);

    // Get brokers and search messages
    const brokers = await this.mskClient.getBootstrapBrokers(clusterArn);
    const rawMessages = await this.kafkaManager.searchMessages(
      brokers,
      clusterArn,
      topicName,
      searchTerm,
      partition,
      actualMaxResults
    );

    // Process messages (same as browse_messages)
    const messages = rawMessages.map(msg => {
      const base64Value = msg.value ? msg.value.toString('base64') : null;
      const base64Key = msg.key ? msg.key.toString('base64') : null;

      if (decodeProtobuf && messageType && base64Value) {
        const decodeResult = this.protobufDecoder.tryDecode(base64Value, messageType);

        if (decodeResult.success) {
          return {
            offset: msg.offset,
            partition: msg.partition,
            timestamp: msg.timestamp,
            key: base64Key,
            decoded: decodeResult.data
          };
        } else {
          return {
            offset: msg.offset,
            partition: msg.partition,
            timestamp: msg.timestamp,
            key: base64Key,
            decodingError: decodeResult.error,
            rawValueBase64: decodeResult.rawBase64
          };
        }
      }

      return {
        offset: msg.offset,
        partition: msg.partition,
        timestamp: msg.timestamp,
        keyBase64: base64Key,
        valueBase64: base64Value
      };
    });

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: search_messages ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          cluster: clusterArn,
          topic: topicName,
          searchTerm,
          searchedPartition: partition !== undefined ? partition : 'all',
          maxResults: actualMaxResults,
          matchCount: messages.length,
          messages
        }, null, 2)}`
      }]
    };
  }

  async handleListProtobufTypes(args) {
    const types = this.protobufDecoder.listMessageTypes();

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: list_protobuf_types ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'success',
          count: types.length,
          types
        }, null, 2)}`
      }]
    };
  }

  // Error Formatting

  formatError(toolName, error) {
    const errorType = this._categorizeError(error);

    return {
      content: [{
        type: 'text',
        text: `✴️ ✴️ ✴️ ✴️  MCP.MSK: ${toolName} ✴️ ✴️ ✴️ ✴️\n\n${JSON.stringify({
          status: 'error',
          errorType,
          message: error instanceof Error ? error.message : String(error),
          suggestion: this._getSuggestion(errorType, error)
        }, null, 2)}`
      }]
    };
  }

  _categorizeError(error) {
    const message = error.message || String(error);

    if (message.includes('not found') || message.includes('NotFoundException')) {
      return 'NotFoundError';
    }
    if (message.includes('Access') || message.includes('AccessDenied')) {
      return 'AuthenticationError';
    }
    if (message.includes('Connection') || message.includes('timeout')) {
      return 'ConnectionError';
    }
    if (message.includes('protobuf') || message.includes('decode')) {
      return 'ProtobufError';
    }
    if (message.includes('required') || message.includes('invalid')) {
      return 'ValidationError';
    }

    return 'UnknownError';
  }

  _getSuggestion(errorType, error) {
    switch (errorType) {
      case 'AuthenticationError':
        return 'Check AWS credentials and IAM permissions (kafka:*, kafka-cluster:*)';
      case 'ConnectionError':
        return 'Check security groups allow traffic on port 9094, verify network connectivity';
      case 'ProtobufError':
        return 'Use list_protobuf_types to see available message types';
      case 'NotFoundError':
        return 'Verify cluster ARN, topic name, and partition number are correct';
      case 'ValidationError':
        return 'Check that all required parameters are provided';
      default:
        return 'Check error message for details';
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MSK MCP Server running on stdio');
  }
}

// Start server
const server = new MSKMCPServer();
server.run().catch(console.error);
