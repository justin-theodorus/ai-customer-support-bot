/**
 * Pinecone Integration Types
 * Updated to use Pinecone's integrated embeddings
 */

// Record format for Pinecone integrated embeddings
export type UpsertRecord = {
  id: string;
  chunk_text: string; // The field name must match the 'textField' in your index config
  
    category: string;
    question: string;
    source?: string;
    timestamp: string;
    original_text: string;
  
};

// FAQ record structure from scraped data
export interface FAQRecord {
  _id: string;
  chunk_text: string;
  category: string;
  question: string;
  source?: string;
  timestamp?: string;
}

// Search configuration
export interface SearchConfig {
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
  includeValues?: boolean;
  namespace?: string;
}

// Search result from Pinecone
export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  values?: number[];
}

// Comprehensive search response
export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  processingTime: number;
  query: string;
  namespace?: string;
}

// Category-based search
export interface CategorySearchConfig extends SearchConfig {
  category: string;
}

// Hybrid search configuration
export interface HybridSearchConfig extends SearchConfig {
  alpha?: number; // Weight for semantic vs keyword search
  sparseValues?: Record<string, number>;
}

// Reranking configuration
export interface RerankConfig {
  model?: string;
  topK?: number;
  relevanceThreshold?: number;
}

// Index configuration for Pinecone integrated embeddings
export interface IndexConfig {
  name: string;
  cloud: 'aws' | 'gcp' | 'azure';
  region: string;
  model: string; // e.g., 'llama-text-embed-v2'
  textField: string; // Field name containing text to embed
  waitUntilReady?: boolean;
}

// Index statistics
export interface IndexStats {
  vectorCount: number;
  dimension: number;
  indexFullness: number;
  totalVectorCount: number;
  namespaces: Record<string, { vectorCount: number }>;
}

// Error types
export interface PineconeError {
  code: string;
  message: string;
  details?: any;
}

// Batch operation result
export interface BatchResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: PineconeError[];
  processingTime: number;
}

// Performance metrics
export interface PerformanceMetrics {
  indexingTime: number;
  searchTime: number;
  vectorCount: number;
  processingTime: number;
} 