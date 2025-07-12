/**
 * Pinecone Client with Integrated Embeddings
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { IndexConfig, IndexStats } from './types';

class PineconeClient {
  private static instance: PineconeClient;
  private client: Pinecone;
  private initialized = false;

  private constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is required');
    }

    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.initialized = true;
  }

  static getInstance(): PineconeClient {
    if (!PineconeClient.instance) {
      PineconeClient.instance = new PineconeClient();
    }
    return PineconeClient.instance;
  }

  /**
   * Create an index with integrated embeddings
   */
  async createIndexForModel(config: IndexConfig): Promise<void> {
    try {
      console.log(`Creating index with integrated embeddings: ${config.name}`);
      
      await this.client.createIndexForModel({
        name: config.name,
        cloud: config.cloud,
        region: config.region,
        embed: {
          model: config.model,
          fieldMap: { text: config.textField },
        },
        waitUntilReady: config.waitUntilReady ?? true,
      });

      console.log(`Index ${config.name} created successfully`);
    } catch (error) {
      console.error(`Error creating index ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get index instance
   */
  getIndex(indexName: string, namespace?: string) {
    const index = this.client.index(indexName);
    return namespace ? index.namespace(namespace) : index;
  }

  /**
   * Check if index exists
   */
  async indexExists(indexName: string): Promise<boolean> {
    try {
      const indexes = await this.client.listIndexes();
      return indexes.indexes?.some(index => index.name === indexName) ?? false;
    } catch (error) {
      console.error(`Error checking if index exists: ${indexName}`, error);
      return false;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexName: string): Promise<void> {
    try {
      console.log(`Deleting index: ${indexName}`);
      await this.client.deleteIndex(indexName);
      console.log(`Index ${indexName} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexName: string): Promise<IndexStats> {
    try {
      const index = this.client.index(indexName);
      const stats = await index.describeIndexStats();
      
      return {
        vectorCount: stats.totalRecordCount || 0,
        dimension: stats.dimension || 0,
        indexFullness: stats.indexFullness || 0,
        totalVectorCount: stats.totalRecordCount || 0,
        namespaces: Object.fromEntries(
          Object.entries(stats.namespaces || {}).map(([key, value]) => [
            key,
            { vectorCount: value.recordCount || 0 }
          ])
        ),
      };
    } catch (error) {
      console.error(`Error getting index stats for ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * List all indexes
   */
  async listIndexes(): Promise<string[]> {
    try {
      const result = await this.client.listIndexes();
      return result.indexes?.map(index => index.name) || [];
    } catch (error) {
      console.error('Error listing indexes:', error);
      throw error;
    }
  }

  /**
   * Describe index configuration
   */
  async describeIndex(indexName: string) {
    try {
      return await this.client.describeIndex(indexName);
    } catch (error) {
      console.error(`Error describing index ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  async waitForIndex(indexName: string, timeout = 300000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const description = await this.describeIndex(indexName);
        if (description.status?.ready) {
          console.log(`Index ${indexName} is ready`);
          return;
        }
        
        console.log(`Waiting for index ${indexName} to be ready...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error waiting for index ${indexName}:`, error);
        throw error;
      }
    }
    
    throw new Error(`Timeout waiting for index ${indexName} to be ready`);
  }

  /**
   * Get the raw Pinecone client
   */
  getClient(): Pinecone {
    return this.client;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export default PineconeClient; 