/**
 * Pinecone Integration with Integrated Embeddings
 */

// Export main services
export { default as PineconeClient } from './client';
export { default as PineconeStorage } from './storage';
export { default as PineconeSearch } from './search';

// Export all types
export * from './types';

// Export convenience instances
import PineconeClient from './client';
import PineconeStorage from './storage';
import PineconeSearch from './search';

export const pineconeClient = PineconeClient.getInstance();
export const pineconeStorage = new PineconeStorage();
export const pineconeSearch = new PineconeSearch(); 