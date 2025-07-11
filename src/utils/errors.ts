import { Logger } from "./logger";

const logger = new Logger("Utils:Errors");

/**
 * Base error class for all application errors
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Configuration and validation errors
 */
export class ConfigurationError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = "CONFIGURATION_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Configuration Error: ${message}`, context);
  }
}

/**
 * External API errors (Exa, Pinecone, VAPI, OpenAI)
 */
export class ExternalAPIError extends AppError {
  readonly statusCode = 502;
  readonly errorCode = "EXTERNAL_API_ERROR";
  readonly isOperational = true;

  constructor(
    public readonly service: string,
    message: string,
    context?: Record<string, any>
  ) {
    super(`${service} API Error: ${message}`, context);
  }
}

/**
 * Data processing errors
 */
export class DataProcessingError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = "DATA_PROCESSING_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Data Processing Error: ${message}`, context);
  }
}

/**
 * Vector database errors
 */
export class VectorDatabaseError extends AppError {
  readonly statusCode = 503;
  readonly errorCode = "VECTOR_DATABASE_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Vector Database Error: ${message}`, context);
  }
}

/**
 * Voice assistant errors
 */
export class VoiceAssistantError extends AppError {
  readonly statusCode = 503;
  readonly errorCode = "VOICE_ASSISTANT_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Voice Assistant Error: ${message}`, context);
  }
}

/**
 * Content scraping errors
 */
export class ScrapingError extends AppError {
  readonly statusCode = 502;
  readonly errorCode = "SCRAPING_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Scraping Error: ${message}`, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = "VALIDATION_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Validation Error: ${message}`, context);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = "RATE_LIMIT_ERROR";
  readonly isOperational = true;

  constructor(message: string = "Rate limit exceeded", context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = "AUTH_ERROR";
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(`Authentication Error: ${message}`, context);
  }
}

/**
 * Generic application errors
 */
export class ApplicationError extends AppError {
  readonly statusCode = 500;
  readonly errorCode = "APPLICATION_ERROR";
  readonly isOperational = false;

  constructor(message: string, context?: Record<string, any>) {
    super(`Application Error: ${message}`, context);
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Handle and log errors appropriately
   */
  static handle(error: Error, context?: Record<string, any>) {
    if (error instanceof AppError) {
      logger.error(`${error.errorCode}: ${error.message}`, error, {
        ...context,
        ...error.context,
      });
    } else {
      logger.error("Unhandled Error", error, context);
    }
  }

  /**
   * Check if error is operational (expected) or programming error
   */
  static isOperational(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Get HTTP status code from error
   */
  static getStatusCode(error: Error): number {
    if (error instanceof AppError) {
      return error.statusCode;
    }
    return 500;
  }

  /**
   * Get error code from error
   */
  static getErrorCode(error: Error): string {
    if (error instanceof AppError) {
      return error.errorCode;
    }
    return "UNKNOWN_ERROR";
  }

  /**
   * Format error for API response
   */
  static formatForResponse(error: Error, includeStack = false) {
    const baseResponse = {
      error: true,
      message: error.message,
      code: this.getErrorCode(error),
      statusCode: this.getStatusCode(error),
    };

    if (includeStack && error.stack) {
      return {
        ...baseResponse,
        stack: error.stack,
      };
    }

    return baseResponse;
  }
}

/**
 * Utility function to wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.handle(error as Error, context);
      throw error;
    }
  };
}

/**
 * Retry utility with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Check if error is worth retrying
      if (error instanceof AppError && !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Determine if an error should trigger a retry
 */
function shouldRetry(error: AppError): boolean {
  // Don't retry validation errors, auth errors, etc.
  const nonRetryableErrors = [
    "VALIDATION_ERROR",
    "AUTH_ERROR",
    "CONFIGURATION_ERROR",
  ];

  return !nonRetryableErrors.includes(error.errorCode);
} 