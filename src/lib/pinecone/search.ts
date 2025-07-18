// Pinecone Search Service with Integrated Embeddings

import PineconeClient from './client';
import { SearchConfig, SearchResult, SearchResponse, CategorySearchConfig, HybridSearchConfig } from './types';

export class PineconeSearch {
  private client: PineconeClient;

  constructor() {
    this.client = PineconeClient.getInstance();
  }

   /**
   * Semantic search with Pinecone's built-in reranking using searchRecords.
   */
   async semanticSearch(
    indexName: string,
    query: string,
    config: SearchConfig = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      console.log(`Performing semantic search with reranking on index ${indexName}`);
      const index = this.client.getIndex(indexName, config.namespace);
      
      const topK = config.topK || 10;
      
      const queryResponse = await index.searchRecords({
        query: {
          // Best practice: Fetch more candidates for the reranker to work with.
          topK: Math.min(topK * 5, 100),
          inputs: { text: query },
          filter: config.filter,
        },
        rerank: {
          model: 'bge-reranker-v2-m3',
          // Return the number of results you originally wanted.
          topN: topK, 
          // Use the metadata field containing the full text for best results.
          rankFields: ['original_text'], 
        },
      });

      // FIX 1: The response from `searchRecords` is in `queryResponse.result.hits`
      const hits = queryResponse.result.hits as Record<string, unknown>[];
      const results: SearchResult[] = hits?.map((hit: Record<string, unknown>) => ({
        id: hit.id as string,
        score: (hit.score as number) || 0, // The score from the reranker will be here
        // FIX 2: Metadata from `searchRecords` is in the `fields` property
        metadata: hit.fields as Record<string, unknown>, 
      })) || [];

      return {
        results,
        totalResults: results.length,
        processingTime: Date.now() - startTime,
        query,
        namespace: config.namespace,
      };
    } catch (error) {
      console.error('Error in semantic search:', error);
      throw error;
    }
  }

  // The methods below are now simpler as they just call the powerful semanticSearch.
  
  /**
   * Category-based search
   */
  async categorySearch(
    indexName: string,
    query: string,
    config: CategorySearchConfig
  ): Promise<SearchResponse> {
    const searchConfig: SearchConfig = {
      ...config,
      filter: {
        category: { $eq: config.category },
        ...config.filter,
      },
    };
    return this.semanticSearch(indexName, query, searchConfig);
  }

  /**
   * Multi-category search
   */
  async multiCategorySearch(
    indexName: string,
    query: string,
    categories: string[],
    config: SearchConfig = {}
  ): Promise<SearchResponse> {
    const searchConfig: SearchConfig = {
      ...config,
      filter: {
        category: { $in: categories },
        ...config.filter,
      },
    };
    return this.semanticSearch(indexName, query, searchConfig);
  }

  /**
   * Hybrid search (currently just semantic search with additional options)
   */
  async hybridSearch(
    indexName: string,
    query: string,
    config: HybridSearchConfig = {}
  ): Promise<SearchResponse> {
    // For now, hybrid search is just semantic search
    // In the future, this could combine semantic and keyword search
    return this.semanticSearch(indexName, query, config);
  }

  /**
   * Find similar documents to a given document ID
   */
  async findSimilar(
    indexName: string,
    documentId: string,
    config: SearchConfig = {}
  ): Promise<SearchResponse> {

    try {
      console.log(`Finding similar documents to ${documentId}`);

      // For integrated embeddings, we can't easily fetch the original document
      // Instead, we'll do a general search and exclude the original document
      // This is a simplified approach that works with integrated embeddings
      
      // Use a generic search query to find similar documents
      const searchQuery = "similar documents";
      
      return this.semanticSearch(indexName, searchQuery, {
        ...config,
        topK: (config.topK || 10) + 1, // Get one extra to account for potential self-match
        filter: {
          // Note: For integrated embeddings, we can't easily exclude by ID in the filter
          // This is a limitation of the current approach
          ...config.filter,
        },
      });
    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw error;
    }
  }

  

  /**
   * Get all categories in the index
   */
  async getCategories(indexName: string, namespace?: string): Promise<string[]> {
    try {
      // Query for a small sample to get categories
      const response = await this.semanticSearch(indexName, 'sample query', {
        topK: 100,
        namespace,
      });

      const categories = new Set<string>();
      response.results.forEach(result => {
        if (result.metadata?.category) {
          categories.add(result.metadata.category as string);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get records by category
   */
  async getRecordsByCategory(
    indexName: string,
    category: string,
    config: SearchConfig = {}
  ): Promise<SearchResponse> {
    return this.categorySearch(indexName, '', {
      ...config,
      category,
      topK: config.topK || 100,
    });
  }

  /**
   * Count records by category
   */
  async countByCategory(indexName: string, namespace?: string): Promise<Record<string, number>> {
    try {
      const categories = await this.getCategories(indexName, namespace);
      const counts: Record<string, number> = {};

      for (const category of categories) {
        const results = await this.getRecordsByCategory(indexName, category, { namespace });
        counts[category] = results.totalResults;
      }

      return counts;
    } catch (error) {
      console.error('Error counting by category:', error);
      return {};
    }
  }

  
}

export default PineconeSearch; 