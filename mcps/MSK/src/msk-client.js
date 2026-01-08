import {
  KafkaClient,
  ListClustersV2Command,
  DescribeClusterV2Command,
  GetBootstrapBrokersCommand,
} from "@aws-sdk/client-kafka"

/**
 * MSKClient - Wrapper for AWS MSK API operations
 * Handles cluster discovery and broker endpoint retrieval
 * Matches CloudWatch MCP pattern from /Users/teolin/_WORK/done / AI/mcps/CloudWatch/src/index.js
 */
export class MSKClient {
  constructor() {
    // Initialize AWS Kafka client with credentials
    // Follows CloudWatch MCP authentication pattern
    const config = {
      region:
        process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    }

    // Support explicit credentials or default AWS credential chain
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }

      // Support temporary credentials (IAM role assumption)
      if (process.env.AWS_SESSION_TOKEN) {
        config.credentials.sessionToken = process.env.AWS_SESSION_TOKEN
      }
    }

    this.client = new KafkaClient(config)

    // Cache broker endpoints to reduce AWS API calls
    // Map<clusterArn, {brokers: string[], timestamp: number}>
    this.brokerCache = new Map()
    this.CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * List all MSK clusters in the region
   *
   * @param {number} maxResults - Maximum number of clusters to return
   * @param {string|null} clusterNameFilter - Filter clusters by name
   * @returns {Promise<Array>} - Array of cluster objects
   */
  async listClusters(maxResults = 50, clusterNameFilter = null) {
    try {
      const params = {
        MaxResults: maxResults,
      }

      if (clusterNameFilter) {
        params.ClusterNameFilter = clusterNameFilter
      }

      const command = new ListClustersV2Command(params)
      const response = await this.client.send(command)

      return (response.ClusterInfoList || []).map((cluster) => ({
        arn: cluster.ClusterArn,
        name: cluster.ClusterName,
        state: cluster.State,
        clusterType: cluster.ClusterType,
        creationTime: cluster.CreationTime,
        brokerNodeGroupInfo: cluster.Provisioned?.BrokerNodeGroupInfo
          ? {
              instanceType:
                cluster.Provisioned.BrokerNodeGroupInfo.InstanceType,
              numberOfBrokerNodes:
                cluster.Provisioned.BrokerNodeGroupInfo.ClientSubnets?.length ||
                0,
            }
          : null,
      }))
    } catch (error) {
      throw new Error(`Failed to list MSK clusters: ${error.message}`)
    }
  }

  /**
   * Get detailed information about a specific MSK cluster
   *
   * @param {string} clusterArn - ARN of the MSK cluster
   * @returns {Promise<Object>} - Cluster details
   */
  async getClusterDetails(clusterArn) {
    try {
      const command = new DescribeClusterV2Command({
        ClusterArn: clusterArn,
      })

      const response = await this.client.send(command)
      const cluster = response.ClusterInfo

      if (!cluster) {
        throw new Error("Cluster not found")
      }

      return {
        arn: cluster.ClusterArn,
        name: cluster.ClusterName,
        state: cluster.State,
        clusterType: cluster.ClusterType,
        currentVersion: cluster.CurrentVersion,
        creationTime: cluster.CreationTime,
        kafkaVersion:
          cluster.Provisioned?.KafkaVersion || cluster.Serverless?.KafkaVersion,
        numberOfBrokerNodes:
          cluster.Provisioned?.NumberOfBrokerNodes || "Serverless",
        storageMode: cluster.StorageMode,
        tags: cluster.Tags || {},
      }
    } catch (error) {
      if (error.name === "NotFoundException") {
        throw new Error(`MSK cluster not found: ${clusterArn}`)
      }
      throw new Error(`Failed to get cluster details: ${error.message}`)
    }
  }

  /**
   * Get bootstrap broker endpoints for an MSK cluster
   * Implements caching to reduce AWS API calls
   *
   * @param {string} clusterArn - ARN of the MSK cluster
   * @returns {Promise<string[]>} - Array of broker endpoint strings
   */
  async getBootstrapBrokers(clusterArn) {
    // Check cache first
    const cached = this.brokerCache.get(clusterArn)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.brokers
    }

    try {
      const command = new GetBootstrapBrokersCommand({
        ClusterArn: clusterArn,
      })

      const response = await this.client.send(command)

      // Prefer TLS brokers, fallback chain
      const brokerString =
        response.BootstrapBrokerStringTls ||
        response.BootstrapBrokerString ||
        response.BootstrapBrokerStringPublicTls ||
        response.BootstrapBrokerStringPublic ||
        response.BootstrapBrokerStringSaslIam ||
        response.BootstrapBrokerStringSaslScram

      if (!brokerString) {
        throw new Error("No bootstrap brokers found for cluster")
      }

      // Split comma-separated broker list
      const brokers = brokerString.split(",").map((b) => b.trim())

      // Cache the result
      this.brokerCache.set(clusterArn, {
        brokers,
        timestamp: Date.now(),
      })

      return brokers
    } catch (error) {
      if (error.name === "NotFoundException") {
        throw new Error(`MSK cluster not found: ${clusterArn}`)
      }
      throw new Error(`Failed to get bootstrap brokers: ${error.message}`)
    }
  }

  /**
   * Clear the broker cache (useful for testing or forcing refresh)
   */
  clearBrokerCache() {
    this.brokerCache.clear()
  }

  /**
   * Get cached broker info (for debugging)
   *
   * @returns {Array} - Array of cached entries
   */
  getCachedBrokers() {
    return Array.from(this.brokerCache.entries()).map(([arn, data]) => ({
      clusterArn: arn,
      brokers: data.brokers,
      cachedAt: new Date(data.timestamp).toISOString(),
      expiresAt: new Date(data.timestamp + this.CACHE_TTL).toISOString(),
      isExpired: Date.now() - data.timestamp >= this.CACHE_TTL,
    }))
  }
}
