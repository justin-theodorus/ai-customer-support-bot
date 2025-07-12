/**
 * Search API with Pinecone Integrated Embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pineconeClient, pineconeSearch } from '@/lib/pinecone';
import { SearchConfig } from '@/lib/pinecone/types';
import { Logger } from '@/utils/logger';

const logger = new Logger('API:Search');

// Default configuration
const DEFAULT_INDEX_NAME = 'aven-support';
const DEFAULT_NAMESPACE = 'default';

// Request schemas
const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  indexName: z.string().optional(),
  namespace: z.string().optional(),
  topK: z.number().min(1).max(100).optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  includeMetadata: z.boolean().optional(),
  includeValues: z.boolean().optional(),
  useReranking: z.boolean().optional(),
  searchType: z.enum(['semantic', 'category', 'hybrid', 'similar']).optional(),
  documentId: z.string().optional(), // For similar search
  filter: z.record(z.any()).optional(),
});

const StatsRequestSchema = z.object({
  indexName: z.string().optional(),
  namespace: z.string().optional(),
});

/**
 * POST /api/search - Perform semantic search
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      indexName,
      namespace,
      topK,
      category,
      categories,
      includeMetadata,
      includeValues,
      useReranking,
      searchType,
      documentId,
      filter,
    } = SearchRequestSchema.parse(body);

    const finalIndexName = indexName || DEFAULT_INDEX_NAME;
    const finalNamespace = namespace || DEFAULT_NAMESPACE;

    logger.info('Processing search request', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      indexName: finalIndexName,
      namespace: finalNamespace,
      topK,
      category,
      categories,
      searchType,
      useReranking,
    });

    // Check if index exists
    const indexExists = await pineconeClient.indexExists(finalIndexName);
    if (!indexExists) {
      return NextResponse.json(
        { error: 'Index not found', indexName: finalIndexName },
        { status: 404 }
      );
    }

    // Prepare search configuration
    const searchConfig: SearchConfig = {
      topK: topK || 10,
      includeMetadata: includeMetadata ?? true,
      includeValues: includeValues ?? false,
      namespace: finalNamespace,
      filter,
    };

    let result;

    // Execute search based on type
    switch (searchType) {
      case 'category':
        if (!category) {
          return NextResponse.json(
            { error: 'Category required for category search' },
            { status: 400 }
          );
        }
        result = await pineconeSearch.categorySearch(finalIndexName, query, {
          ...searchConfig,
          category,
        });
        break;

      case 'similar':
        if (!documentId) {
          return NextResponse.json(
            { error: 'Document ID required for similar search' },
            { status: 400 }
          );
        }
        result = await pineconeSearch.findSimilar(finalIndexName, documentId, searchConfig);
        break;

      case 'hybrid':
        result = await pineconeSearch.hybridSearch(finalIndexName, query, searchConfig);
        break;

      default:
        // Default to semantic search
        if (categories && categories.length > 0) {
          result = await pineconeSearch.multiCategorySearch(finalIndexName, query, categories, searchConfig);
        } else if (category) {
          result = await pineconeSearch.categorySearch(finalIndexName, query, {
            ...searchConfig,
            category,
          });
        } else {
          result = await pineconeSearch.semanticSearch(finalIndexName, query, searchConfig);
        }
        break;
    }

    // Apply reranking if requested
    if (useReranking && searchType !== 'similar') {
      result = await pineconeSearch.searchWithReranking(finalIndexName, query, searchConfig);
    }

    logger.info('Search completed', {
      resultsCount: result.results.length,
      processingTime: result.processingTime,
      indexName: finalIndexName,
      namespace: finalNamespace,
    });

    return NextResponse.json({
      success: true,
      ...result,
      indexName: finalIndexName,
      integrated_embeddings: true,
    });

  } catch (error) {
    logger.error('Error processing search', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search - Get search statistics and available categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indexName = searchParams.get('indexName') || DEFAULT_INDEX_NAME;
    const namespace = searchParams.get('namespace') || DEFAULT_NAMESPACE;
    const action = searchParams.get('action') || 'stats';

    logger.info('Getting search information', { indexName, namespace, action });

    // Check if index exists
    const indexExists = await pineconeClient.indexExists(indexName);
    if (!indexExists) {
      return NextResponse.json(
        { error: 'Index not found', indexName },
        { status: 404 }
      );
    }

    switch (action) {
      case 'categories':
        const categories = await pineconeSearch.getCategories(indexName, namespace);
        return NextResponse.json({
          success: true,
          categories,
          indexName,
          namespace,
        });

      case 'category-counts':
        const categoryCounts = await pineconeSearch.countByCategory(indexName, namespace);
        return NextResponse.json({
          success: true,
          categoryCounts,
          indexName,
          namespace,
        });

      case 'stats':
      default:
        const stats = await pineconeClient.getIndexStats(indexName);
        const availableCategories = await pineconeSearch.getCategories(indexName, namespace);
        
        return NextResponse.json({
          success: true,
          indexName,
          namespace,
          stats,
          categories: availableCategories,
          integrated_embeddings: true,
          model: 'llama-text-embed-v2',
        });
    }

  } catch (error) {
    logger.error('Error getting search information', { error });
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Example requests for testing
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    message: 'Search API with Pinecone Integrated Embeddings',
    endpoints: {
      'POST /api/search': {
        description: 'Perform semantic search',
        body: {
          query: 'string (required)',
          indexName: 'string (optional)',
          namespace: 'string (optional)',
          topK: 'number (optional, 1-100)',
          category: 'string (optional)',
          categories: 'string[] (optional)',
          includeMetadata: 'boolean (optional)',
          includeValues: 'boolean (optional)',
          useReranking: 'boolean (optional)',
          searchType: "'semantic' | 'category' | 'hybrid' | 'similar' (optional)",
          documentId: 'string (required for similar search)',
          filter: 'object (optional)',
        },
      },
      'GET /api/search': {
        description: 'Get search statistics and categories',
        params: {
          indexName: 'string (optional)',
          namespace: 'string (optional)',
          action: "'stats' | 'categories' | 'category-counts' (optional)",
        },
      },
    },
    examples: {
      semantic_search: {
        query: 'How do I make a payment?',
        topK: 5,
        includeMetadata: true,
      },
      category_search: {
        query: 'payment methods',
        category: 'Payments',
        topK: 10,
      },
      multi_category_search: {
        query: 'account setup',
        categories: ['Before You Apply', 'Account Management'],
        topK: 8,
      },
      similar_search: {
        searchType: 'similar',
        documentId: 'doc_123',
        topK: 5,
      },
    },
  });
} 