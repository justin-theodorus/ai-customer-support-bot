#!/usr/bin/env node
// Pinecone Setup Script with Integrated Embeddings

import { Command } from 'commander';
import { IndexConfig } from '../src/lib/pinecone/types';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Default configuration
const DEFAULT_CONFIG: IndexConfig = {
  name: 'aven-support',
  cloud: 'aws',
  region: 'us-east-1',
  model: 'llama-text-embed-v2',
  textField: 'chunk_text',
  waitUntilReady: true,
};

const DEFAULT_NAMESPACE = 'default';

/**
 * Get index statistics via API
 */
async function getIndexStats(indexName: string): Promise<{
  totalVectorCount?: number;
  dimension?: number;
  indexFullness?: number;
  namespaces?: Record<string, { vectorCount: number }>;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}/api/embeddings?indexName=${encodeURIComponent(indexName)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get index stats: ${response.status}`);
  }
  
  const result = await response.json();
  return result.stats;
}

/**
 * Process data via embeddings API
 */
async function processEmbeddings(config: {
  dataFile?: string;
  indexName: string;
  namespace: string;
  forceRecreate: boolean;
  batchSize: number;
}): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  stats: {
    totalVectorCount?: number;
    dimension?: number;
    indexFullness?: number;
    namespaces?: Record<string, { vectorCount: number }>;
  };
}> {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Embeddings API failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Embeddings API returned error: ${result.error || 'Unknown error'}`);
  }
  
  return result;
}

async function main() {
  const program = new Command();
  
  program
    .name('setup-pinecone')
    .description('Setup Pinecone with integrated embeddings')
    .option('-f, --force', 'Force recreate index if it exists')
    .option('-n, --namespace <namespace>', 'Namespace to use', DEFAULT_NAMESPACE)
    .option('-d, --data-file <file>', 'Path to FAQ data file')
    .option('-i, --index-name <name>', 'Index name to create/use', DEFAULT_CONFIG.name)
    .option('-m, --model <model>', 'Embedding model to use', DEFAULT_CONFIG.model)
    .option('-b, --batch-size <size>', 'Batch size for uploads', '90')
    .option('--dry-run', 'Preview what would be done without making changes')
    .option('--help-advanced', 'Show advanced usage examples')
    .parse(process.argv);

  const options = program.opts();

  if (options.helpAdvanced) {
    showAdvancedHelp();
    return;
  }

  console.log(chalk.blue('🚀 Pinecone Setup with Integrated Embeddings'));
  console.log(chalk.gray('================================================'));

  try {
    const indexName = options.indexName || DEFAULT_CONFIG.name;
    const namespace = options.namespace || DEFAULT_NAMESPACE;
    const batchSize = parseInt(options.batchSize) || 100;

    console.log(chalk.yellow('Configuration:'));
    console.log(`  Index Name: ${indexName}`);
    console.log(`  Namespace: ${namespace}`);
    console.log(`  Model: ${options.model || DEFAULT_CONFIG.model}`);
    console.log(`  Batch Size: ${batchSize}`);
    console.log(`  Force Recreate: ${options.force ? 'Yes' : 'No'}`);
    console.log(`  Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log();

    // Check if index exists via API
    console.log(chalk.blue('📊 Checking index status via API...'));
    const indexStats = await getIndexStats(indexName).catch(() => null);
    const indexExists = indexStats !== null;
    
    console.log(chalk.blue(`📊 Index "${indexName}" exists: ${indexExists ? 'Yes' : 'No'}`));

    if (indexExists && !options.force) {
      console.log(chalk.yellow('⚠️  Index already exists. Use --force to recreate it.'));
      
      // Show existing index stats
      if (indexStats) {
        console.log(chalk.gray('Current index stats:'));
        console.log(`  Total vectors: ${indexStats.totalVectorCount || 0}`);
        console.log(`  Dimension: ${indexStats.dimension || 'N/A'}`);
        console.log(`  Index fullness: ${((indexStats.indexFullness || 0) * 100).toFixed(2)}%`);
        console.log(`  Namespaces: ${Object.keys(indexStats.namespaces || {}).join(', ')}`);
      }
      return;
    }

    // Load and process data via API
    const dataFile = options.dataFile || findLatestDataFile();
    if (!dataFile && !options.dryRun) {
      console.log(chalk.red('❌ No data file found. Please provide --data-file or ensure data exists in data/scraped/'));
      return;
    }

    if (dataFile) {
      console.log(chalk.blue(`📄 Using data file: ${dataFile}`));
      
      if (!fs.existsSync(dataFile)) {
        console.log(chalk.red(`❌ Data file not found: ${dataFile}`));
        return;
      }

      // Show data preview
      const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      const faqs = rawData.faqs || rawData;

      if (!Array.isArray(faqs) || faqs.length === 0) {
        console.log(chalk.red('❌ No FAQ data found in file'));
        return;
      }

      console.log(chalk.green(`📋 Found ${faqs.length} FAQ records`));

      if (faqs.length > 0) {
        console.log(chalk.yellow('Data preview:'));
        const categories = [...new Set(faqs.map((faq: { category: string }) => faq.category))];
        console.log(`  Categories: ${categories.join(', ')}`);
        console.log(`  Sample record: ${faqs[0]._id} - ${faqs[0].chunk_text.substring(0, 100)}...`);
        console.log();
      }
    }

    console.log(chalk.blue('📤 Processing data with integrated embeddings via API...'));
    console.log(`  Batch Size: ${batchSize}`);

    if (!options.dryRun) {
      const startTime = Date.now();
      
      const result = await processEmbeddings({
        dataFile,
        indexName,
        namespace,
        forceRecreate: options.force || false,
        batchSize,
      });

      const duration = Date.now() - startTime;
      
      console.log(chalk.green('✅ Data processed successfully via API'));
      console.log(`  Processed: ${result.processed} records`);
      console.log(`  Failed: ${result.failed} records`);
      console.log(`  Duration: ${duration}ms`);

      // Show final stats
      console.log(chalk.blue('📊 Final index statistics:'));
      const finalStats = result.stats;
      console.log(`  Total vectors: ${finalStats.totalVectorCount || 0}`);
      console.log(`  Dimension: ${finalStats.dimension || 'N/A'}`);
      console.log(`  Index fullness: ${((finalStats.indexFullness || 0) * 100).toFixed(2)}%`);
      console.log(`  Namespaces: ${Object.keys(finalStats.namespaces || {}).join(', ')}`);
      
      if (finalStats.namespaces && finalStats.namespaces[namespace]) {
        console.log(`  Records in "${namespace}": ${finalStats.namespaces[namespace].vectorCount}`);
      }
    } else {
      console.log(chalk.gray('(Dry run) Would process data via API:'));
      console.log(`  - Data file: ${dataFile || 'Latest from data/scraped/'}`);
      console.log(`  - Index: ${indexName}`);
      console.log(`  - Namespace: ${namespace}`);
      console.log(`  - Batch size: ${batchSize}`);
      console.log(`  - Force recreate: ${options.force ? 'Yes' : 'No'}`);
    }

    console.log();
    console.log(chalk.green('🎉 Setup complete!'));
    console.log(chalk.gray('You can now use the search API to query your data.'));
    console.log(chalk.gray('Example: POST /api/search with {"query": "How do I make a payment?"}'));

  } catch (error: unknown) {
    console.error(chalk.red('❌ Setup failed:'), error);
    process.exit(1);
  }
}

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

function showAdvancedHelp() {
  console.log(chalk.blue('Advanced Usage Examples:'));
  console.log();
  console.log(chalk.yellow('Basic setup:'));
  console.log('  npm run setup:pinecone');
  console.log();
  console.log(chalk.yellow('Force recreate index:'));
  console.log('  npm run setup:pinecone -- --force');
  console.log();
  console.log(chalk.yellow('Custom namespace:'));
  console.log('  npm run setup:pinecone -- --namespace production');
  console.log();
  console.log(chalk.yellow('Custom data file:'));
  console.log('  npm run setup:pinecone -- --data-file ./data/custom-faqs.json');
  console.log();
  console.log(chalk.yellow('Custom index name and model:'));
  console.log('  npm run setup:pinecone -- --index-name custom-support --model llama-text-embed-v2');
  console.log();
  console.log(chalk.yellow('Dry run to preview changes:'));
  console.log('  npm run setup:pinecone -- --dry-run');
  console.log();
  console.log(chalk.yellow('Large dataset with bigger batches:'));
  console.log('  npm run setup:pinecone -- --batch-size 200 --data-file ./data/large-dataset.json');
  console.log();
  console.log(chalk.blue('Available Models:'));
  console.log('  - llama-text-embed-v2 (default)');
  console.log('  - Other models supported by Pinecone');
  console.log();
  console.log(chalk.blue('Data File Format:'));
  console.log('  Expected JSON structure:');
  console.log('  {');
  console.log('    "faqs": [');
  console.log('      {');
  console.log('        "_id": "unique-id",');
  console.log('        "chunk_text": "FAQ content text",');
  console.log('        "category": "Category Name",');
  console.log('        "question": "Question Text"');
  console.log('      }');
  console.log('    ]');
  console.log('  }');
  console.log();
  console.log(chalk.blue('Environment Variables:'));
  console.log('  PINECONE_API_KEY - Your Pinecone API key (required)');
}

if (require.main === module) {
  main().catch(console.error);
} 