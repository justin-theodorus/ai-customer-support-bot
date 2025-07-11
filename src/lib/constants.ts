/**
 * Application constants for the AI Customer Support Bot
 */

// Application Information
export const APP_NAME = "Aven AI Customer Support Bot";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "AI-powered customer support bot for Aven using Exa AI, Pinecone, and VAPI";

// API Endpoints
export const API_ROUTES = {
  HEALTH: "/api/health",
  SCRAPE: "/api/scrape",
  SEARCH: "/api/search",
  EMBEDDINGS: "/api/embeddings",
  VAPI_WEBHOOK: "/api/vapi/webhook",
  VAPI_ASSISTANT: "/api/vapi/assistant",
  VAPI_CALL: "/api/vapi/call",
} as const;

// Content Processing
export const CONTENT_LIMITS = {
  MIN_CHUNK_SIZE: 100,
  MAX_CHUNK_SIZE: 1200,
  DEFAULT_CHUNK_SIZE: 800,
  DEFAULT_CHUNK_OVERLAP: 200,
  MIN_CONTENT_LENGTH: 50,
  MAX_CONTENT_LENGTH: 10000,
} as const;

// Vector Database
export const VECTOR_CONFIG = {
  DIMENSION: 1536, // text-embedding-3-small
  METRIC: "cosine",
  DEFAULT_TOP_K: 5,
  DEFAULT_SCORE_THRESHOLD: 0.7,
  DEFAULT_NAMESPACE: "aven-support",
} as const;

// Text Processing
export const TEXT_SEPARATORS = [
  "\n\n", // Paragraph breaks
  "\n",   // Line breaks
  ".",    // Sentences
  "!",    // Exclamations
  "?",    // Questions
  ";",    // Semicolons
  ":",    // Colons
  " ",    // Spaces (last resort)
] as const;

// Content Types
export const CONTENT_TYPES = {
  FAQ: "faq",
  GUIDE: "guide",
  TUTORIAL: "tutorial",
  DOCUMENTATION: "documentation",
  SUPPORT: "support",
  TROUBLESHOOTING: "troubleshooting",
} as const;

// Content Sources
export const CONTENT_SOURCES = {
  SCRAPED: "scraped",
  MANUAL: "manual",
  IMPORTED: "imported",
  GENERATED: "generated",
} as const;

// Status Types
export const STATUS_TYPES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

// Voice Assistant Configuration
export const VOICE_CONFIG = {
  DEFAULT_VOICE_ID: "rachel",
  DEFAULT_LANGUAGE: "en-US",
  DEFAULT_TEMPERATURE: 0.1,
  MAX_RESPONSE_TOKENS: 150,
  CALL_TIMEOUT: 300000, // 5 minutes
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  EXA_REQUESTS_PER_MINUTE: 60,
  EXA_REQUESTS_PER_DAY: 1000,
  OPENAI_REQUESTS_PER_MINUTE: 500,
  PINECONE_REQUESTS_PER_MINUTE: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MISSING_CONFIG: "Required configuration is missing",
  INVALID_API_KEY: "Invalid API key provided",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please try again later",
  SCRAPING_FAILED: "Failed to scrape content from the specified URL",
  EMBEDDING_FAILED: "Failed to generate embeddings for the content",
  VECTOR_SEARCH_FAILED: "Failed to search vector database",
  VOICE_CALL_FAILED: "Failed to initiate voice call",
  PROCESSING_FAILED: "Failed to process content",
  VALIDATION_FAILED: "Data validation failed",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CONTENT_SCRAPED: "Content successfully scraped and processed",
  EMBEDDINGS_GENERATED: "Embeddings successfully generated and stored",
  SEARCH_COMPLETED: "Search completed successfully",
  VOICE_CALL_INITIATED: "Voice call initiated successfully",
  PROCESSING_COMPLETED: "Content processing completed successfully",
} as const;

// File Extensions
export const SUPPORTED_FILE_TYPES = {
  TEXT: [".txt", ".md", ".markdown"],
  JSON: [".json"],
  CSV: [".csv"],
  HTML: [".html", ".htm"],
} as const;

// Data Storage Directories
export const STORAGE_DIRS = {
  RAW: "data/raw",
  PROCESSED: "data/processed",
  VECTORIZED: "data/vectorized",
  BACKUPS: "data/backups",
  LOGS: "logs",
  TEMP: "temp",
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  API_KEY: /^[a-zA-Z0-9_-]+$/,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 3600, // 1 hour
  SEARCH_RESULTS_TTL: 1800, // 30 minutes
  EMBEDDINGS_TTL: 86400, // 24 hours
  MAX_CACHE_SIZE: 1000,
} as const;

// Monitoring and Analytics
export const METRICS = {
  RESPONSE_TIME_BUCKETS: [0.1, 0.3, 0.5, 0.7, 1, 2, 5, 10],
  ERROR_RATE_THRESHOLD: 0.05, // 5%
  UPTIME_TARGET: 0.995, // 99.5%
} as const;

// Content Quality Thresholds
export const QUALITY_THRESHOLDS = {
  MIN_RELEVANCE_SCORE: 0.7,
  MIN_CONFIDENCE_SCORE: 0.6,
  MAX_RESPONSE_TIME: 5000, // 5 seconds
  MIN_CONTENT_QUALITY: 0.8,
} as const;

// Export all constants as a single object for easier importing
export const CONSTANTS = {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  API_ROUTES,
  CONTENT_LIMITS,
  VECTOR_CONFIG,
  TEXT_SEPARATORS,
  CONTENT_TYPES,
  CONTENT_SOURCES,
  STATUS_TYPES,
  VOICE_CONFIG,
  RATE_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SUPPORTED_FILE_TYPES,
  STORAGE_DIRS,
  VALIDATION_PATTERNS,
  CACHE_CONFIG,
  METRICS,
  QUALITY_THRESHOLDS,
} as const; 