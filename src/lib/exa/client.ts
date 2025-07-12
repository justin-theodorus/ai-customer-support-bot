import Exa from "exa-js";
import { env } from "@/config/env";
import { Logger } from "@/utils/logger";
import type { ExaClientConfig, ExaSearchResponse, ExaContentOptions } from "./types";

const logger = new Logger("ExaClient");

export class ExaClient {
  private client: Exa;
  private config: ExaClientConfig;

  constructor(config?: Partial<ExaClientConfig>) {
    this.config = {
      apiKey: config?.apiKey || env.EXA_API_KEY,
      baseUrl: config?.baseUrl,
    };

    if (!this.config.apiKey) {
      throw new Error("EXA_API_KEY is required");
    }

    this.client = new Exa(this.config.apiKey);
    logger.info("Exa client initialized");
  }

  /**
   * Search for content using Exa AI
   */
  async search(
    query: string,
    options: {
      type?: "neural" | "keyword" | "auto";
      numResults?: number;
      includeDomains?: string[];
      excludeDomains?: string[];
      startCrawlDate?: string;
      endCrawlDate?: string;
      category?: string;
    } = {}
  ): Promise<ExaSearchResponse> {
    try {
      logger.info(`Executing Exa search: "${query}"`);
      
      const searchOptions = {
        type: options.type || "neural",
        numResults: options.numResults || 10,
        includeDomains: options.includeDomains,
        excludeDomains: options.excludeDomains,
        startCrawlDate: options.startCrawlDate,
        endCrawlDate: options.endCrawlDate,
        category: options.category,
      };

      const result = await this.client.search(query, searchOptions);
      
      logger.info(`Search completed: ${result.results.length} results found`);
      return result;
    } catch (error) {
      logger.error("Exa search failed:", error);
      throw new Error(`Exa search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get content for specific URLs or IDs
   */
  async getContents(
    ids: string[],
    options: ExaContentOptions = {}
  ): Promise<any> {
    try {
      logger.info(`Fetching content for ${ids.length} items`);
      
      const result = await this.client.getContents(ids, options);
      
      logger.info(`Content retrieval completed`);
      return result;
    } catch (error) {
      logger.error("Content retrieval failed:", error);
      throw new Error(`Content retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find similar content based on a URL
   */
  async findSimilar(
    url: string,
    options: {
      numResults?: number;
      excludeSourceDomain?: boolean;
      category?: string;
    } = {}
  ): Promise<ExaSearchResponse> {
    try {
      logger.info(`Finding similar content for: ${url}`);
      
      const result = await this.client.findSimilar(url, {
        numResults: options.numResults || 10,
        excludeSourceDomain: options.excludeSourceDomain || false,
        category: options.category,
      });
      
      logger.info(`Similar content search completed: ${result.results.length} results`);
      return result;
    } catch (error) {
      logger.error("Similar content search failed:", error);
      throw new Error(`Similar content search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retry wrapper for any Exa operation
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }
        
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError!;
  }

  /**
   * Health check for the Exa API connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Perform a simple search to test the connection
      await this.search("test", { numResults: 1 });
      return true;
    } catch (error) {
      logger.error("Exa health check failed:", error);
      return false;
    }
  }
}

// Create a singleton instance
export const exaClient = new ExaClient(); 