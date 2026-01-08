import { Kafka, logLevel } from "kafkajs"

/**
 * KafkaClientManager - Manages Kafka connections and message consumption
 * Uses ephemeral consumers for each request (no persistent connections)
 */
export class KafkaClientManager {
  constructor() {
    // Cache Kafka clients by cluster ARN
    this.clients = new Map()

    // Connection configuration
    this.connectionTimeout = parseInt(
      process.env.KAFKA_CONNECTION_TIMEOUT || "30000",
      10
    )
    this.requestTimeout = parseInt(
      process.env.KAFKA_REQUEST_TIMEOUT || "30000",
      10
    )
    this.authType = process.env.MSK_AUTH_TYPE || "TLS"
  }

  /**
   * Get or create a Kafka client for a cluster
   *
   * @param {string[]} brokers - Array of broker endpoints
   * @param {string} clusterArn - Cluster ARN (used as cache key)
   * @returns {Promise<Kafka>} - Kafka client instance
   */
  async getClient(brokers, clusterArn) {
    // Check cache
    if (this.clients.has(clusterArn)) {
      return this.clients.get(clusterArn)
    }

    // Create new Kafka client
    const kafkaConfig = {
      clientId: `msk-mcp-${Date.now()}`,
      brokers: brokers,
      logLevel: logLevel.ERROR,
      connectionTimeout: this.connectionTimeout,
      requestTimeout: this.requestTimeout,
    }

    // Configure authentication based on MSK_AUTH_TYPE
    if (this.authType === "IAM") {
      // IAM authentication
      kafkaConfig.ssl = true
      kafkaConfig.sasl = {
        mechanism: "aws",
        // AWS SDK credential provider will be used automatically
      }
    } else if (this.authType === "TLS") {
      // TLS only (no SASL)
      kafkaConfig.ssl = true
    } else if (this.authType === "PLAINTEXT") {
      // Plaintext (not recommended for production)
      kafkaConfig.ssl = false
    }

    const kafka = new Kafka(kafkaConfig)
    this.clients.set(clusterArn, kafka)

    return kafka
  }

  /**
   * List all topics in a Kafka cluster
   *
   * @param {string[]} brokers - Array of broker endpoints
   * @param {string} clusterArn - Cluster ARN
   * @returns {Promise<string[]>} - Array of topic names
   */
  async listTopics(brokers, clusterArn) {
    const kafka = await this.getClient(brokers, clusterArn)
    const admin = kafka.admin()

    try {
      await admin.connect()
      const topics = await admin.listTopics()
      return topics.sort()
    } finally {
      await admin.disconnect()
    }
  }

  /**
   * Get metadata for a specific topic
   *
   * @param {string[]} brokers - Array of broker endpoints
   * @param {string} clusterArn - Cluster ARN
   * @param {string} topicName - Name of the topic
   * @returns {Promise<Object>} - Topic metadata
   */
  async getTopicMetadata(brokers, clusterArn, topicName) {
    const kafka = await this.getClient(brokers, clusterArn)
    const admin = kafka.admin()

    try {
      await admin.connect()
      const metadata = await admin.fetchTopicMetadata({ topics: [topicName] })

      if (!metadata.topics || metadata.topics.length === 0) {
        throw new Error(`Topic not found: ${topicName}`)
      }

      const topic = metadata.topics[0]

      return {
        name: topic.name,
        partitions: topic.partitions.map((p) => ({
          partitionId: p.partitionId,
          leader: p.leader,
          replicas: p.replicas,
          isr: p.isr,
          offlineReplicas: p.offlineReplicas,
        })),
      }
    } finally {
      await admin.disconnect()
    }
  }

  /**
   * Browse messages from a specific partition/offset
   * Uses ephemeral consumer that disconnects after collecting messages
   *
   * @param {string[]} brokers - Array of broker endpoints
   * @param {string} clusterArn - Cluster ARN
   * @param {string} topicName - Name of the topic
   * @param {number} partition - Partition number
   * @param {number|undefined} offset - Starting offset (undefined = latest)
   * @param {number} limit - Maximum number of messages to retrieve
   * @returns {Promise<Array>} - Array of messages
   */
  async browseMessages(
    brokers,
    clusterArn,
    topicName,
    partition,
    offset,
    limit = 10
  ) {
    const kafka = await this.getClient(brokers, clusterArn)

    // Create ephemeral consumer with unique group ID
    const consumer = kafka.consumer({
      groupId: `msk-mcp-browse-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
    })

    const messages = []
    let messageHandler

    try {
      await consumer.connect()

      // Subscribe to topic
      await consumer.subscribe({
        topic: topicName,
        fromBeginning: offset !== undefined,
      })

      // Create message handler
      messageHandler = consumer.run({
        eachMessage: async ({ topic, partition: msgPartition, message }) => {
          // Only collect messages from the specified partition
          if (msgPartition === partition) {
            messages.push({
              offset: message.offset,
              partition: msgPartition,
              timestamp: message.timestamp,
              key: message.key, // Binary Buffer
              value: message.value, // Binary Buffer
              headers: message.headers,
            })

            // Stop when we have enough messages
            if (messages.length >= limit) {
              await consumer.pause([
                { topic: topicName, partitions: [partition] },
              ])
              await consumer.stop()
            }
          }
        },
      })

      // Seek to specific offset if provided
      if (offset !== undefined) {
        await consumer.seek({
          topic: topicName,
          partition,
          offset: offset.toString(),
        })
      }

      // Wait for messages or timeout (10 seconds)
      await new Promise((resolve) => setTimeout(resolve, 10000))
    } catch (error) {
      throw new Error(`Failed to browse messages: ${error.message}`)
    } finally {
      try {
        await consumer.disconnect()
      } catch (disconnectError) {
        // Ignore disconnect errors
        console.error(`Disconnect error (ignored): ${disconnectError.message}`)
      }
    }

    return messages
  }

  /**
   * Search for messages containing specific text across partitions
   *
   * @param {string[]} brokers - Array of broker endpoints
   * @param {string} clusterArn - Cluster ARN
   * @param {string} topicName - Name of the topic
   * @param {string} searchTerm - Text to search for
   * @param {number|undefined} partition - Specific partition (undefined = all)
   * @param {number} maxResults - Maximum number of results
   * @returns {Promise<Array>} - Array of matching messages
   */
  async searchMessages(
    brokers,
    clusterArn,
    topicName,
    searchTerm,
    partition,
    maxResults = 50
  ) {
    const kafka = await this.getClient(brokers, clusterArn)

    // Get topic metadata to determine partitions to search
    const metadata = await this.getTopicMetadata(
      brokers,
      clusterArn,
      topicName
    )

    const partitionsToSearch =
      partition !== undefined
        ? [partition]
        : metadata.partitions.map((p) => p.partitionId)

    const results = []
    const searchTermLower = searchTerm.toLowerCase()

    // Search each partition sequentially
    for (const part of partitionsToSearch) {
      if (results.length >= maxResults) break

      try {
        // Browse last 100 messages from partition
        const messages = await this.browseMessages(
          brokers,
          clusterArn,
          topicName,
          part,
          undefined, // Latest messages
          100
        )

        // Filter messages that match search term
        for (const msg of messages) {
          if (results.length >= maxResults) break

          // Search in message value (convert to string)
          const valueStr = msg.value ? msg.value.toString() : ""
          const keyStr = msg.key ? msg.key.toString() : ""

          // Case-insensitive substring match
          if (
            valueStr.toLowerCase().includes(searchTermLower) ||
            keyStr.toLowerCase().includes(searchTermLower)
          ) {
            results.push(msg)
          }
        }
      } catch (error) {
        // Continue searching other partitions even if one fails
        console.error(`Error searching partition ${part}: ${error.message}`)
        continue
      }
    }

    return results
  }

  /**
   * Clean up all Kafka clients
   */
  cleanup() {
    this.clients.clear()
  }
}
