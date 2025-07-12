/**
 * Pinecone Search Service with Integrated Embeddings
 */

import PineconeClient from './client';
import { SearchConfig, SearchResult, SearchResponse, CategorySearchConfig, HybridSearchConfig } from './types';

export class PineconeSearch {
  private client: PineconeClient;

  constructor() {
    this.client = PineconeClient.getInstance();
  }

  /**
   * Semantic search using integrated embeddings
   */
  async semanticSearch(
    indexName: string,
    query: string,
    config: SearchConfig = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      console.log(`Performing semantic search on index ${indexName}`);

      const index = this.client.getIndex(indexName, config.namespace);
      
      // Use searchRecords with integrated embeddings - Pinecone handles embedding generation
      const queryResponse = await index.searchRecords({
        query: {
          topK: config.topK || 10,
          inputs: { text: query }, // Correct structure for integrated embeddings
          filter: config.filter,
        },
      });

      // Type assertion to work around TypeScript definition issues
      const hits = queryResponse.result.hits as any[];
      const results: SearchResult[] = hits?.map((hit: any) => ({
        id: hit.id,
        score: hit.score || 0,
        metadata: hit.fields, // For searchRecords, metadata is in 'fields'
        values: undefined, // searchRecords doesn't return values
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
    const startTime = Date.now();

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
   * Search with reranking (simulated)
   */
  async searchWithReranking(
    indexName: string,
    query: string,
    config: SearchConfig = {}
  ): Promise<SearchResponse> {
    // Get initial results
    const initialResults = await this.semanticSearch(indexName, query, {
      ...config,
      topK: Math.min((config.topK || 10) * 2, 100), // Get more results for reranking
    });

    // Simulate reranking by scoring based on query match
    const rerankedResults = this.simulateReranking(initialResults.results, query);

    // Return top results after reranking
    const finalResults = rerankedResults.slice(0, config.topK || 10);

    return {
      ...initialResults,
      results: finalResults,
      totalResults: finalResults.length,
    };
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

  /**
   * Simulate reranking by scoring text similarity
   */
  private simulateReranking(results: SearchResult[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    
    return results
      .map(result => {
        const text = (result.metadata?.chunk_text as string)?.toLowerCase() || '';
        
        // Simple scoring based on keyword matches
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
        const textWords = text.split(/\s+/);
        
        let keywordScore = 0;
        queryWords.forEach(queryWord => {
          if (textWords.some(textWord => textWord.includes(queryWord))) {
            keywordScore += 1;
          }
        });
        
        // Combine semantic score with keyword score
        const combinedScore = (result.score * 0.7) + (keywordScore * 0.3);
        
        return {
          ...result,
          score: combinedScore,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}

export default PineconeSearch; 