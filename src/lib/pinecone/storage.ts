// Pinecone Storage Service with Integrated Embeddings

import PineconeClient from './client';
import { UpsertRecord, FAQRecord, BatchResult } from './types';

export class PineconeStorage {
  private client: PineconeClient;

  constructor() {
    this.client = PineconeClient.getInstance();
  }

  /**
   * Upsert records using Pinecone's integrated embeddings
   */
  async upsertRecords(
    indexName: string,
    records: UpsertRecord[],
    namespace?: string
  ): Promise<BatchResult> {
    const startTime = Date.now();
    let processedCount = 0;
    const errors: unknown[] = [];

    try {
      console.log(`Upserting ${records.length} records to index ${indexName}`);

      const index = this.client.getIndex(indexName, namespace);
      
      // Use upsertRecords for integrated embeddings
      await index.upsertRecords(records);
      
      processedCount = records.length;
      
      console.log(`Successfully upserted ${processedCount} records`);
      
      return {
        success: true,
        processedCount,
        failedCount: 0,
        errors,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error upserting records:', error);
      errors.push({
        code: 'UPSERT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      });

      return {
        success: false,
        processedCount,
        failedCount: records.length - processedCount,
        errors,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Batch upsert records with automatic batching
   */
  async batchUpsertRecords(
    indexName: string,
    records: UpsertRecord[],
    batchSize: number = 100,
    namespace?: string
  ): Promise<BatchResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    const allErrors: unknown[] = [];

    try {
      console.log(`Batch upserting ${records.length} records in batches of ${batchSize}`);

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        
        const result = await this.upsertRecords(indexName, batch, namespace);
        
        totalProcessed += result.processedCount;
        allErrors.push(...result.errors);

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < records.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        success: allErrors.length === 0,
        processedCount: totalProcessed,
        failedCount: records.length - totalProcessed,
        errors: allErrors,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error in batch upsert:', error);
      
      return {
        success: false,
        processedCount: totalProcessed,
        failedCount: records.length - totalProcessed,
        errors: [
          ...allErrors,
          {
            code: 'BATCH_ERROR',
            message: error instanceof Error ? error.message : 'Unknown batch error',
            details: error,
          },
        ],
        processingTime: Date.now() - startTime,
      };
    }
  }

/**
   * Converts FAQ records to the flat object format required for integrated embedding upserts.
   */
convertFaqsToUpsertRecords(faqs: FAQRecord[]): UpsertRecord[] {
  return faqs.map(faq => {
    // For this specific API, all fields are at the top level.
    // Pinecone will identify 'id' and 'chunk_text' and treat the rest as metadata.
    return {
      id: faq._id,
      chunk_text: faq.chunk_text,
      category: faq.category,
      question: faq.question,
      source: faq.source,
      timestamp: faq.timestamp || new Date().toISOString(),
      original_text: faq.chunk_text
    };
  });
}

  /**
   * Delete records by IDs
   */
  async deleteRecords(
    indexName: string,
    ids: string[],
    namespace?: string
  ): Promise<void> {
    try {
      console.log(`Deleting ${ids.length} records from index ${indexName}`);
      
      const index = this.client.getIndex(indexName, namespace);
      await index.deleteMany(ids);
      
      console.log(`Successfully deleted ${ids.length} records`);
    } catch (error) {
      console.error('Error deleting records:', error);
      throw error;
    }
  }

  /**
   * Delete all records in a namespace
   */
  async deleteAllRecords(indexName: string, namespace?: string): Promise<void> {
    try {
      console.log(`Deleting all records from index ${indexName}${namespace ? ` in namespace ${namespace}` : ''}`);
      
      const index = this.client.getIndex(indexName, namespace);
      await index.deleteAll();
      
      console.log('Successfully deleted all records');
    } catch (error) {
      console.error('Error deleting all records:', error);
      throw error;
    }
  }

  /**
   * Get record by ID
   */
  async getRecord(indexName: string, id: string, namespace?: string): Promise<unknown> {
    try {
      const index = this.client.getIndex(indexName, namespace);
      const result = await index.fetch([id]);
      return result.records?.[id] || null;
    } catch (error) {
      console.error(`Error fetching record ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple records by IDs
   */
  async getRecords(indexName: string, ids: string[], namespace?: string): Promise<unknown[]> {
    try {
      const index = this.client.getIndex(indexName, namespace);
      const result = await index.fetch(ids);
      return ids.map(id => result.records?.[id] || null).filter(record => record !== null);
    } catch (error) {
      console.error(`Error fetching records:`, error);
      throw error;
    }
  }
}

export default PineconeStorage; 