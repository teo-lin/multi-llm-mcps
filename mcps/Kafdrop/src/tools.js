export const tools = [
  {
    name: "list_topics",
    description: "List all Kafka topics in the cluster",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_topic_details",
    description: "Get detailed information about a specific Kafka topic",
    inputSchema: {
      type: "object",
      properties: {
        topic_name: {
          type: "string",
          description: "Name of the Kafka topic",
        },
      },
      required: ["topic_name"],
    },
  },
  {
    name: "browse_messages",
    description: "Browse messages from a Kafka topic partition",
    inputSchema: {
      type: "object",
      properties: {
        topic_name: {
          type: "string",
          description: "Name of the Kafka topic",
        },
        partition: {
          type: "number",
          description: "Partition number",
        },
        offset: {
          type: "number",
          description: "Starting offset (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of messages to retrieve (default: 10)",
        },
        format: {
          type: "string",
          enum: ["json", "text", "avro", "protobuf"],
          description: "Message format (default: json)",
        },
      },
      required: ["topic_name", "partition"],
    },
  },
  {
    name: "list_consumer_groups",
    description: "List all Kafka consumer groups",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_consumer_group_details",
    description: "Get consumer group lag and offset information",
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "string",
          description: "Consumer group ID",
        },
      },
      required: ["group_id"],
    },
  },
  {
    name: "list_brokers",
    description: "List all Kafka brokers in the cluster",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_messages",
    description: "Search for messages in a Kafka topic containing specific text",
    inputSchema: {
      type: "object",
      properties: {
        topic_name: {
          type: "string",
          description: "Name of the Kafka topic",
        },
        search_term: {
          type: "string",
          description: "Text to search for in messages",
        },
        partition: {
          type: "number",
          description:
            "Partition number (optional, searches all if not specified)",
        },
        max_results: {
          type: "number",
          description: "Maximum number of results (default: 50)",
        },
      },
      required: ["topic_name", "search_term"],
    },
  },
]
