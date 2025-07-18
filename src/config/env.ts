import { z } from "zod";
import { Logger } from "@/utils/logger";

// Load environment variables from .env.local (for scripts)
if (typeof window === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({ path: ".env.local" });
}

const logger = new Logger("Config:Env");

// Schema for environment variables
const envSchema = z.object({
  // Next.js Configuration
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Exa AI Configuration
  EXA_API_KEY: z.string().min(1, "EXA_API_KEY is required"),

  // Pinecone Configuration
  PINECONE_API_KEY: z.string().min(1, "PINECONE_API_KEY is required"),
  PINECONE_ENVIRONMENT: z.string().default("us-east-1"),
  PINECONE_INDEX_NAME: z.string().default("aven-support-bot"),

  // VAPI Configuration
  VAPI_PUBLIC_API_KEY: z.string().min(1, "VAPI_PUBLIC_API_KEY is required"),
  VAPI_PRIVATE_API_KEY: z.string().min(1, "VAPI_PRIVATE_API_KEY is required"),
  VAPI_ASSISTANT_ID: z.string().min(1, "VAPI_ASSISTANT_ID is required"),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4-turbo-preview"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),

  // Optional Configuration
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MAX_CHUNK_SIZE: z.coerce.number().default(1200),
  CHUNK_OVERLAP: z.coerce.number().default(200),
});

export type Env = z.infer<typeof envSchema>;

// Function to validate environment variables
const validateEnv = (): Env => {
  try {
    logger.info("Validating environment variables");
    
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      EXA_API_KEY: process.env.EXA_API_KEY,
      PINECONE_API_KEY: process.env.PINECONE_API_KEY,
      PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
      PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
      VAPI_PUBLIC_API_KEY: process.env.VAPI_PUBLIC_API_KEY,
      VAPI_PRIVATE_API_KEY: process.env.VAPI_PRIVATE_API_KEY,
      VAPI_ASSISTANT_ID: process.env.VAPI_ASSISTANT_ID,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
      LOG_LEVEL: process.env.LOG_LEVEL,
      MAX_CHUNK_SIZE: process.env.MAX_CHUNK_SIZE,
      CHUNK_OVERLAP: process.env.CHUNK_OVERLAP,
    };
    
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join(".")}: ${err.message}`);
      logger.error("Invalid environment variables", { error: { missingVars } });
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars.join("\n")}.\n\nPlease check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
};

export const env = validateEnv();
