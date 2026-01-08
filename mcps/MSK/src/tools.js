export const tools = [
  {
    name: "list_clusters",
    description:
      "List all AWS MSK (Managed Streaming for Kafka) clusters in the region",
    inputSchema: {
      type: "object",
      properties: {
        maxResults: {
          type: "number",
          description: "Maximum number of clusters to return (default: 50)",
          default: 50,
        },
        clusterNameFilter: {
          type: "string",
          description: "Filter clusters by name (optional)",
        },
      },
    },
  },
  {
    name: "get_cluster_details",
    description:
      "Get detailed information about a specific MSK cluster including broker endpoints",
    inputSchema: {
      type: "object",
      properties: {
        clusterArn: {
          type: "string",
          description: "ARN of the MSK cluster",
        },
      },
      required: ["clusterArn"],
    },
  },
  {
    name: "list_topics",
    description: "List all Kafka topics in an MSK cluster",
    inputSchema: {
      type: "object",
      properties: {
        clusterArn: {
          type: "string",
          description: "ARN of the MSK cluster",
        },
      },
      required: ["clusterArn"],
    },
  },
  {
    name: "get_topic_metadata",
    description:
      "Get metadata about a Kafka topic including partition count, offsets, and replicas",
    inputSchema: {
      type: "object",
      properties: {
        clusterArn: {
          type: "string",
          description: "ARN of the MSK cluster",
        },
        topicName: {
          type: "string",
          description: "Name of the Kafka topic",
        },
      },
      required: ["clusterArn", "topicName"],
    },
  },
  {
    name: "browse_messages",
    description:
      "Browse/consume messages from a Kafka topic partition with optional protobuf decoding",
    inputSchema: {
      type: "object",
      properties: {
        clusterArn: {
          type: "string",
          description: "ARN of the MSK cluster",
        },
        topicName: {
          type: "string",
          description: "Name of the Kafka topic",
        },
        partition: {
          type: "number",
          description: "Partition number to read from",
        },
        offset: {
          type: "number",
          description: "Starting offset (optional, defaults to latest)",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of messages to retrieve (default: 10, max: 100)",
          default: 10,
        },
        decodeProtobuf: {
          type: "boolean",
          description:
            "Whether to attempt protobuf decoding (default: false)",
          default: false,
        },
        messageType: {
          type: "string",
          description:
            "Protobuf message type name (required if decodeProtobuf is true). Use list_protobuf_types to see available types.",
        },
      },
      required: ["clusterArn", "topicName", "partition"],
    },
  },
  {
    name: "search_messages",
    description:
      "Search for messages containing specific text across topic partitions",
    inputSchema: {
      type: "object",
      properties: {
        clusterArn: {
          type: "string",
          description: "ARN of the MSK cluster",
        },
        topicName: {
          type: "string",
          description: "Name of the Kafka topic",
        },
        searchTerm: {
          type: "string",
          description: "Text to search for in messages (case-insensitive)",
        },
        partition: {
          type: "number",
          description:
            "Specific partition to search (optional, searches all if not specified)",
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results (default: 50, max: 200)",
          default: 50,
        },
        decodeProtobuf: {
          type: "boolean",
          description:
            "Whether to decode messages as protobuf before searching (default: false)",
          default: false,
        },
        messageType: {
          type: "string",
          description:
            "Protobuf message type name (required if decodeProtobuf is true)",
        },
      },
      required: ["clusterArn", "topicName", "searchTerm"],
    },
  },
  {
    name: "list_protobuf_types",
    description:
      "List all available protobuf message types from the loaded proto files",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]
