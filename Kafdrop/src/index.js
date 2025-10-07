#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

class KafdropMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'kafdrop-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.kafdropUrl = process.env.KAFDROP_URL || 'http://localhost:9000';
    this.timeout = parseInt(process.env.KAFDROP_API_TIMEOUT || '30000');

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_topics',
          description: 'List all Kafka topics in the cluster',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_topic_details',
          description: 'Get detailed information about a specific Kafka topic',
          inputSchema: {
            type: 'object',
            properties: {
              topic_name: {
                type: 'string',
                description: 'Name of the Kafka topic',
              },
            },
            required: ['topic_name'],
          },
        },
        {
          name: 'browse_messages',
          description: 'Browse messages from a Kafka topic partition',
          inputSchema: {
            type: 'object',
            properties: {
              topic_name: {
                type: 'string',
                description: 'Name of the Kafka topic',
              },
              partition: {
                type: 'number',
                description: 'Partition number',
              },
              offset: {
                type: 'number',
                description: 'Starting offset (optional)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of messages to retrieve (default: 10)',
              },
              format: {
                type: 'string',
                enum: ['json', 'text', 'avro', 'protobuf'],
                description: 'Message format (default: json)',
              },
            },
            required: ['topic_name', 'partition'],
          },
        },
        {
          name: 'list_consumer_groups',
          description: 'List all Kafka consumer groups',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_consumer_group_details',
          description: 'Get consumer group lag and offset information',
          inputSchema: {
            type: 'object',
            properties: {
              group_id: {
                type: 'string',
                description: 'Consumer group ID',
              },
            },
            required: ['group_id'],
          },
        },
        {
          name: 'list_brokers',
          description: 'List all Kafka brokers in the cluster',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'search_messages',
          description: 'Search for messages in a Kafka topic containing specific text',
          inputSchema: {
            type: 'object',
            properties: {
              topic_name: {
                type: 'string',
                description: 'Name of the Kafka topic',
              },
              search_term: {
                type: 'string',
                description: 'Text to search for in messages',
              },
              partition: {
                type: 'number',
                description: 'Partition number (optional, searches all if not specified)',
              },
              max_results: {
                type: 'number',
                description: 'Maximum number of results (default: 50)',
              },
            },
            required: ['topic_name', 'search_term'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'list_topics':
            return await this.listTopics();
          case 'get_topic_details':
            return await this.getTopicDetails(args);
          case 'browse_messages':
            return await this.browseMessages(args);
          case 'list_consumer_groups':
            return await this.listConsumerGroups();
          case 'get_consumer_group_details':
            return await this.getConsumerGroupDetails(args);
          case 'list_brokers':
            return await this.listBrokers();
          case 'search_messages':
            return await this.searchMessages(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async kafdropRequest(endpoint) {
    try {
      const response = await axios.get(`${this.kafdropUrl}${endpoint}`, {
        headers: {
          Accept: 'application/json',
        },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Kafdrop API error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Cannot connect to Kafdrop at ${this.kafdropUrl}. Is it running?`);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  async listTopics() {
    const data = await this.kafdropRequest('/topic');
    const topics = Array.isArray(data) ? data : [];

    const summary = topics.map(topic => ({
      name: topic.name || topic,
      partitions: topic.partitionCount || topic.partitions?.length || 'N/A',
      replicas: topic.replicationFactor || 'N/A',
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${topics.length} topics:\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    };
  }

  async getTopicDetails(args) {
    const { topic_name } = args;
    const data = await this.kafdropRequest(`/topic/${encodeURIComponent(topic_name)}`);

    return {
      content: [
        {
          type: 'text',
          text: `Topic: ${topic_name}\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async browseMessages(args) {
    const { topic_name, partition, offset, limit = 10, format = 'json' } = args;

    let endpoint = `/topic/${encodeURIComponent(topic_name)}/${partition}/messages`;
    const params = new URLSearchParams();

    if (offset !== undefined) params.append('offset', offset);
    params.append('count', limit);
    if (format) params.append('format', format);

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.kafdropRequest(endpoint);

    return {
      content: [
        {
          type: 'text',
          text: `Messages from topic "${topic_name}" partition ${partition}:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async listConsumerGroups() {
    const data = await this.kafdropRequest('/consumer');
    const groups = Array.isArray(data) ? data : [];

    return {
      content: [
        {
          type: 'text',
          text: `Found ${groups.length} consumer groups:\n\n${JSON.stringify(groups, null, 2)}`,
        },
      ],
    };
  }

  async getConsumerGroupDetails(args) {
    const { group_id } = args;
    const data = await this.kafdropRequest(`/consumer/${encodeURIComponent(group_id)}`);

    return {
      content: [
        {
          type: 'text',
          text: `Consumer Group: ${group_id}\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }

  async listBrokers() {
    const data = await this.kafdropRequest('/broker');
    const brokers = Array.isArray(data) ? data : [];

    return {
      content: [
        {
          type: 'text',
          text: `Found ${brokers.length} brokers:\n\n${JSON.stringify(brokers, null, 2)}`,
        },
      ],
    };
  }

  async searchMessages(args) {
    const { topic_name, search_term, partition, max_results = 50 } = args;

    // Get topic details to know partition count
    const topicData = await this.kafdropRequest(`/topic/${encodeURIComponent(topic_name)}`);
    const partitions = partition !== undefined ? [partition] :
      (topicData.partitions || []).map((p, i) => p.id !== undefined ? p.id : i);

    const results = [];
    let count = 0;

    for (const part of partitions) {
      if (count >= max_results) break;

      try {
        const messages = await this.kafdropRequest(
          `/topic/${encodeURIComponent(topic_name)}/${part}/messages?count=100`
        );

        const messageList = Array.isArray(messages) ? messages : messages.messages || [];

        for (const msg of messageList) {
          if (count >= max_results) break;

          const msgStr = JSON.stringify(msg).toLowerCase();
          if (msgStr.includes(search_term.toLowerCase())) {
            results.push({
              partition: part,
              offset: msg.offset,
              message: msg,
            });
            count++;
          }
        }
      } catch (error) {
        // Skip partitions that error
        continue;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Search results for "${search_term}" in topic "${topic_name}":\n\nFound ${results.length} matches:\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Kafdrop MCP Server running on stdio (connecting to ${this.kafdropUrl})`);
  }
}

const server = new KafdropMCPServer();
server.run().catch(console.error);
