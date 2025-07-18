// Core TypeScript type definitions for the AI Customer Support Bot

// ============================================
// Common Types
// ============================================

export type Status = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type ContentType = "faq" | "guide" | "tutorial" | "documentation" | "support" | "troubleshooting";

export type ContentSource = "scraped" | "manual" | "imported" | "generated";

export type LogLevel = "debug" | "info" | "warn" | "error";

// ============================================
// Exa AI Types
// ============================================

export interface ExaSearchOptions {
  query: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  useAutoprompt?: boolean;
  category?: string;
  type?: "neural" | "keyword";
}

export interface ExaSearchResult {
  id: string;
  url: string;
  title: string;
  score: number;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
}

export interface ExaResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

// ============================================
// Content Processing Types
// ============================================

export interface RawContent {
  id: string;
  url: string;
  title: string;
  content: string;
  metadata: ContentMetadata;
  scrapedAt: Date;
  source: ContentSource;
}

export interface ContentMetadata {
  url: string;
  title: string;
  description?: string;
  author?: string;
  publishedDate?: string;
  lastModified?: string;
  contentType: ContentType;
  language?: string;
  wordCount: number;
  headings: HeadingStructure[];
  keywords: string[];
}

export interface HeadingStructure {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id?: string;
}

export interface ProcessedContent {
  id: string;
  title: string;
  content: string;
  cleanedContent: string;
  metadata: ContentMetadata;
  chunks: ContentChunk[];
  processedAt: Date;
  status: Status;
  quality: ContentQuality;
}

export interface ContentChunk {
  id: string;
  contentId: string;
  text: string;
  metadata: ChunkMetadata;
  embedding?: number[];
  vectorId?: string;
}

export interface ChunkMetadata {
  startIndex: number;
  endIndex: number;
  wordCount: number;
  section?: string;
  headingContext?: string[];
  keywords: string[];
  relevanceScore?: number;
}

export interface ContentQuality {
  overall: number; // 0-1
  readability: number; // 0-1
  completeness: number; // 0-1
  accuracy: number; // 0-1
  relevance: number; // 0-1
  issues: string[];
}

// ============================================
// Vector Database Types
// ============================================

export interface VectorEmbedding {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export interface VectorMetadata {
  contentId: string;
  chunkId: string;
  text: string;
  title: string;
  url: string;
  contentType: ContentType;
  section?: string;
  keywords: string[];
  publishedDate?: string;
  lastUpdated: string;
}

export interface VectorSearchQuery {
  vector?: number[];
  query?: string;
  topK?: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  namespace?: string;
  filter?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  values?: number[];
  metadata: VectorMetadata;
}

export interface VectorSearchResponse {
  matches: VectorSearchResult[];
  namespace: string;
}

// ============================================
// RAG System Types
// ============================================

export interface RAGQuery {
  question: string;
  context?: string;
  conversationHistory?: ConversationTurn[];
  options?: RAGOptions;
}

export interface RAGOptions {
  topK?: number;
  scoreThreshold?: number;
  maxContextLength?: number;
  includeMetadata?: boolean;
  rerankResults?: boolean;
  responseFormat?: "conversational" | "technical" | "brief";
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  confidence: number;
  processingTime: number;
  metadata: RAGMetadata;
}

export interface RAGSource {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  relevanceScore: number;
  section?: string;
}

export interface RAGMetadata {
  queryId: string;
  retrievalTime: number;
  generationTime: number;
  sourcesUsed: number;
  averageRelevanceScore: number;
  model: string;
}

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// VAPI Types
// ============================================

export interface VAPIAssistant {
  id: string;
  name: string;
  model: VAPIModel;
  voice: VAPIVoice;
  transcriber: VAPITranscriber;
  firstMessage?: string;
  systemMessage?: string;
  functions?: VAPIFunction[];
  metadata?: Record<string, unknown>;
}

export interface VAPIModel {
  provider: "openai" | "anthropic" | "together-ai";
  model: string;
  temperature?: number;
  maxTokens?: number;
  emotionRecognitionEnabled?: boolean;
  numFastTurns?: number;
}

export interface VAPIVoice {
  provider: "11labs" | "openai" | "azure" | "deepgram" | "playht";
  voiceId: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
}

export interface VAPITranscriber {
  provider: "deepgram" | "gladia" | "assembly-ai" | "openai";
  model?: string;
  language?: string;
  smartFormat?: boolean;
  keywords?: string[];
}

export interface VAPIFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface VAPICall {
  id: string;
  assistantId?: string;
  phoneNumberId?: string;
  customer?: VAPICustomer;
  status: VAPICallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  cost?: number;
  transcript?: VAPITranscript;
  recording?: string;
  analysis?: VAPICallAnalysis;
}

export interface VAPICustomer {
  number: string;
  name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export type VAPICallStatus = 
  | "queued" 
  | "ringing" 
  | "in-progress" 
  | "forwarding" 
  | "ended";

export interface VAPITranscript {
  messages: VAPIMessage[];
}

export interface VAPIMessage {
  role: "user" | "assistant" | "system" | "function";
  message: string;
  timestamp: Date;
  endTimestamp?: Date;
  duration?: number;
  confidence?: number;
}

export interface VAPICallAnalysis {
  summary: string;
  successfullyTransferredCall?: boolean;
  userSentiment?: "positive" | "neutral" | "negative";
  callSuccessful?: boolean;
  keywords: string[];
  actionItems: string[];
}

export interface VAPIWebhookEvent {
  type: VAPIWebhookEventType;
  call: VAPICall;
  message?: VAPIMessage;
  timestamp: Date;
}

export type VAPIWebhookEventType =
  | "call-start"
  | "call-end"
  | "call-hanging-up"
  | "speech-start"
  | "speech-end"
  | "transcript"
  | "function-call"
  | "end-of-call-report";

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: APIError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// Analytics & Monitoring Types
// ============================================

export interface SystemMetrics {
  timestamp: Date;
  uptime: number;
  memory: MemoryUsage;
  api: APIMetrics;
  database: DatabaseMetrics;
  errors: ErrorMetrics;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface APIMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  rateLimit: {
    current: number;
    limit: number;
    resetTime: Date;
  };
}

export interface DatabaseMetrics {
  vectorCount: number;
  indexSize: number;
  queriesPerSecond: number;
  averageQueryTime: number;
}

export interface ErrorMetrics {
  total: number;
  byType: Record<string, number>;
  recent: ErrorLog[];
}

export interface ErrorLog {
  timestamp: Date;
  level: LogLevel;
  message: string;
  code: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export interface UsageAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  calls: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
  };
  queries: {
    total: number;
    successful: number;
    averageResponseTime: number;
    topQueries: Array<{
      query: string;
      count: number;
    }>;
  };
  costs: {
    total: number;
    byService: Record<string, number>;
  };
}

// ============================================
// Configuration Types
// ============================================

export interface AppConfig {
  app: {
    name: string;
    version: string;
    url: string;
    environment: string;
  };
  exa: ExaConfig;
  pinecone: PineconeConfig;
  vapi: VAPIConfig;
  openai: OpenAIConfig;
  processing: ProcessingConfig;
  rag: RAGConfig;
}

export interface ExaConfig {
  apiKey: string;
  baseUrl: string;
  defaultSearchOptions: Partial<ExaSearchOptions>;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
  dimension: number;
  metric: string;
  namespace: string;
  topK: number;
}

export interface VAPIConfig {
  publicKey: string;
  privateKey: string;
  baseUrl: string;
  assistant: Partial<VAPIAssistant>;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
  embeddingDimension: number;
}

export interface ProcessingConfig {
  chunking: {
    maxSize: number;
    overlap: number;
    minSize: number;
    separators: string[];
  };
  validation: {
    minContentLength: number;
    maxContentLength: number;
    requiredSections: string[];
  };
}

export interface RAGConfig {
  retrieval: {
    topK: number;
    scoreThreshold: number;
    rerankTopK: number;
  };
  generation: {
    maxContextLength: number;
    includeMetadata: boolean;
    responseFormat: string;
  };
} 