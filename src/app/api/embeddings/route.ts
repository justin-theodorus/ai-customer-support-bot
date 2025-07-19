// Embeddings API with Pinecone Integrated Embeddings

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pineconeClient, pineconeStorage } from '@/lib/pinecone';
import { FAQRecord, IndexConfig } from '@/lib/pinecone/types';
import { Logger } from '@/utils/logger';
import path from 'path';
import fs from 'fs';

const logger = new Logger('API:Embeddings');

// Default index configuration
const DEFAULT_INDEX_CONFIG: IndexConfig = {
  name: 'aven-support',
  cloud: 'aws',
  region: 'us-east-1',
  model: 'llama-text-embed-v2',
  textField: 'chunk_text',
  waitUntilReady: true,
};

// Request schemas
const ProcessDataSchema = z.object({
  dataFile: z.string().optional(),
  indexName: z.string().optional(),
  namespace: z.string().optional(),
  forceRecreate: z.boolean().optional(),
  batchSize: z.number().min(1).max(1000).optional(),
});

const DeleteDataSchema = z.object({
  indexName: z.string().optional(),
  namespace: z.string().optional(),
  deleteAll: z.boolean().optional(),
});

/**
 * Find the latest scraped data file
 */
function findLatestDataFile(): string | null {
  const scrapedDir = path.join(process.cwd(), 'data', 'scraped');
  
  if (!fs.existsSync(scrapedDir)) {
    return null;
  }

  const files = fs.readdirSync(scrapedDir)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(scrapedDir, file),
      mtime: fs.statSync(path.join(scrapedDir, file)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files.length > 0 ? files[0].path : null;
}

/**
 * POST /api/embeddings - Process scraped data and upsert to Pinecone
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataFile, indexName, namespace, forceRecreate, batchSize } = ProcessDataSchema.parse(body);

    const finalIndexName = indexName || DEFAULT_INDEX_CONFIG.name;
    const finalNamespace = namespace || 'default';

    logger.info('Processing embeddings request', {
      dataFile,
      indexName: finalIndexName,
      namespace: finalNamespace,
      forceRecreate,
      batchSize,
    });

    // Check if index exists
    const indexExists = await pineconeClient.indexExists(finalIndexName);
    
    if (!indexExists || forceRecreate) {
      if (indexExists && forceRecreate) {
        logger.info('Deleting existing index for recreation');
        await pineconeClient.deleteIndex(finalIndexName);
        // Wait a moment for deletion to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      logger.info('Creating new index with integrated embeddings');
      await pineconeClient.createIndexForModel({
        ...DEFAULT_INDEX_CONFIG,
        name: finalIndexName,
      });
    }

    // Load data file - find latest if not specified
    let dataPath: string;
    if (dataFile) {
      dataPath = path.isAbsolute(dataFile) ? dataFile : path.join(process.cwd(), dataFile);
    } else {
      // Find the latest scraped data file
      const latestFile = findLatestDataFile();
      if (!latestFile) {
        return NextResponse.json(
          { error: 'No data file found. Please provide dataFile parameter or ensure data exists in data/scraped/' },
          { status: 404 }
        );
      }
      dataPath = latestFile;
    }
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Data file not found', path: dataPath },
        { status: 404 }
      );
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const faqs: FAQRecord[] = rawData.faqs || rawData;

    if (!Array.isArray(faqs) || faqs.length === 0) {
      return NextResponse.json(
        { error: 'No FAQ data found in file' },
        { status: 400 }
      );
    }

    // Convert FAQs to upsert format
    const upsertRecords = pineconeStorage.convertFaqsToUpsertRecords(faqs);
    
    logger.info('Converting FAQs to upsert records', {
      faqCount: faqs.length,
      upsertRecordCount: upsertRecords.length,
    });

    // Upsert data using integrated embeddings
    const result = await pineconeStorage.batchUpsertRecords(
      finalIndexName,
      upsertRecords,
      batchSize || 100,
      finalNamespace
    );

    // Get index stats
    const stats = await pineconeClient.getIndexStats(finalIndexName);

    return NextResponse.json({
      success: true,
      message: 'Data processed successfully with integrated embeddings',
      indexName: finalIndexName,
      namespace: finalNamespace,
      processed: result.processedCount,
      failed: result.failedCount,
      processingTime: result.processingTime,
      stats,
    });

  } catch (error) {
    logger.error('Error processing embeddings', { error });
    
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
 * GET /api/embeddings - Get embedding statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indexName = searchParams.get('indexName') || DEFAULT_INDEX_CONFIG.name;
    const namespace = searchParams.get('namespace') || 'default';

    logger.info('Getting embedding statistics', { indexName, namespace });

    // Check if index exists
    const indexExists = await pineconeClient.indexExists(indexName);
    
    if (!indexExists) {
      return NextResponse.json(
        { error: 'Index not found', indexName },
        { status: 404 }
      );
    }

    // Get index stats
    const stats = await pineconeClient.getIndexStats(indexName);

    return NextResponse.json({
      success: true,
      indexName,
      namespace,
      stats,
      integrated_embeddings: true,
      model: DEFAULT_INDEX_CONFIG.model,
    });

  } catch (error) {
    logger.error('Error getting embedding statistics', { error });
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/embeddings - Delete embedding data
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { indexName, namespace, deleteAll } = DeleteDataSchema.parse(body);

    const finalIndexName = indexName || DEFAULT_INDEX_CONFIG.name;
    const finalNamespace = namespace || 'default';

    logger.info('Deleting embedding data', {
      indexName: finalIndexName,
      namespace: finalNamespace,
      deleteAll,
    });

    // Check if index exists
    const indexExists = await pineconeClient.indexExists(finalIndexName);
    
    if (!indexExists) {
      return NextResponse.json(
        { error: 'Index not found', indexName: finalIndexName },
        { status: 404 }
      );
    }

    if (deleteAll) {
      // Delete all records in namespace
      await pineconeStorage.deleteAllRecords(finalIndexName, finalNamespace);
    } else {
      // Delete the entire index
      await pineconeClient.deleteIndex(finalIndexName);
    }

    return NextResponse.json({
      success: true,
      message: deleteAll ? 'All records deleted from namespace' : 'Index deleted',
      indexName: finalIndexName,
      namespace: finalNamespace,
    });

  } catch (error) {
    logger.error('Error deleting embedding data', { error });
    
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