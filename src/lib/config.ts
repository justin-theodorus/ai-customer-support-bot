import { env } from "@/config/env";

/**
 * Centralized configuration for the AI Customer Support Bot
 */
export const config = {
  // Application Settings
  app: {
    name: "Aven AI Customer Support Bot",
    version: "1.0.0",
    url: env.NEXT_PUBLIC_APP_URL,
    environment: env.NODE_ENV,
  },

  // Exa AI Configuration
  exa: {
    apiKey: env.EXA_API_KEY,
    baseUrl: "https://api.exa.ai",
    defaultSearchOptions: {
      numResults: 10,
      useAutoprompt: true,
      category: "company",
      includeDomains: ["aven.com"], // Will be updated with actual Aven domains
    },
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
    },
  },

  // Pinecone Configuration
  pinecone: {
    apiKey: env.PINECONE_API_KEY,
    environment: env.PINECONE_ENVIRONMENT,
    indexName: env.PINECONE_INDEX_NAME,
    dimension: 1536, // text-embedding-3-small dimension
    metric: "cosine" as const,
    namespace: "aven-support",
    topK: 5, // Default number of results to retrieve
  },

  // VAPI Configuration
  vapi: {
    publicKey: env.VAPI_PUBLIC_API_KEY,
    privateKey: env.VAPI_PRIVATE_API_KEY,
    assistantId: env.VAPI_ASSISTANT_ID,
    baseUrl: "https://api.vapi.ai",
    assistant: {
      model: {
        provider: "openai",
        model: env.OPENAI_MODEL,
        temperature: 0.1,
        maxTokens: 150,
      },
      voice: {
        provider: "11labs",
        voiceId: "rachel", // Can be customized
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
    },
  },

  // OpenAI Configuration
  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    embeddingModel: env.OPENAI_EMBEDDING_MODEL,
    temperature: 0.1,
    maxTokens: 500,
    embeddingDimension: 1536,
  },

  // Content Processing Configuration
  processing: {
    chunking: {
      maxSize: env.MAX_CHUNK_SIZE,
      overlap: env.CHUNK_OVERLAP,
      minSize: 100,
      separators: ["\n\n", "\n", ".", "!", "?", ";", " "],
    },
    validation: {
      minContentLength: 50,
      maxContentLength: 10000,
      requiredSections: ["title", "content"],
    },
  },

  // RAG Configuration
  rag: {
    retrieval: {
      topK: 5,
      scoreThreshold: 0.7,
      rerankTopK: 3,
    },
    generation: {
      maxContextLength: 4000,
      includeMetadata: true,
      responseFormat: "conversational",
    },
  },

  // Logging Configuration
  logging: {
    level: env.LOG_LEVEL,
    enableConsole: true,
    enableFile: env.NODE_ENV === "production",
    logFile: "./logs/app.log",
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },

  // Cache Configuration
  cache: {
    ttl: 3600, // 1 hour in seconds
    maxSize: 1000, // maximum number of cached items
  },

  // Data Storage Paths
  storage: {
    raw: "./data/raw",
    processed: "./data/processed",
    vectorized: "./data/vectorized",
    backups: "./data/backups",
  },
} as const;

export type Config = typeof config; 