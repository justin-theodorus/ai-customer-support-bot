#!/usr/bin/env node
/**
 * Pinecone Setup Script with Integrated Embeddings
 * 
 * This script sets up Pinecone with integrated embeddings and processes FAQ data.
 * 
 * Usage:
 *   npm run setup:pinecone
 *   npm run setup:pinecone -- --force
 *   npm run setup:pinecone -- --namespace custom-namespace
 *   npm run setup:pinecone -- --data-file ./data/custom-data.json
 */

import { Command } from 'commander';
import { PineconeClient, PineconeStorage } from '../src/lib/pinecone';
import { FAQRecord, IndexConfig } from '../src/lib/pinecone/types';
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
    .option('-b, --batch-size <size>', 'Batch size for uploads', '100')
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
    // Initialize Pinecone client
    const pineconeClient = PineconeClient.getInstance();
    const pineconeStorage = new PineconeStorage();

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

    // Check if index exists
    const indexExists = await pineconeClient.indexExists(indexName);
    console.log(chalk.blue(`📊 Index "${indexName}" exists: ${indexExists ? 'Yes' : 'No'}`));

    if (indexExists && !options.force) {
      console.log(chalk.yellow('⚠️  Index already exists. Use --force to recreate it.'));
      
      // Show existing index stats
      const stats = await pineconeClient.getIndexStats(indexName);
      console.log(chalk.gray('Current index stats:'));
      console.log(`  Total vectors: ${stats.totalVectorCount}`);
      console.log(`  Dimension: ${stats.dimension}`);
      console.log(`  Index fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
      console.log(`  Namespaces: ${Object.keys(stats.namespaces).join(', ')}`);
      return;
    }

    // Create or recreate index
    if (options.force && indexExists) {
      console.log(chalk.red('🗑️  Deleting existing index...'));
      if (!options.dryRun) {
        await pineconeClient.deleteIndex(indexName);
        console.log(chalk.green('✅ Index deleted'));
        
        // Wait for deletion to complete
        console.log(chalk.yellow('⏳ Waiting for deletion to complete...'));
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    if (!indexExists || options.force) {
      console.log(chalk.blue('🔧 Creating index with integrated embeddings...'));
      const indexConfig: IndexConfig = {
        name: indexName,
        cloud: DEFAULT_CONFIG.cloud,
        region: DEFAULT_CONFIG.region,
        model: options.model || DEFAULT_CONFIG.model,
        textField: DEFAULT_CONFIG.textField,
        waitUntilReady: true,
      };

      if (!options.dryRun) {
        await pineconeClient.createIndexForModel(indexConfig);
        console.log(chalk.green('✅ Index created with integrated embeddings'));
      } else {
        console.log(chalk.gray('(Dry run) Would create index with config:'), indexConfig);
      }
    }

    // Load and process data
    const dataFile = options.dataFile || findLatestDataFile();
    if (!dataFile) {
      console.log(chalk.red('❌ No data file found. Please provide --data-file or ensure data exists in data/scraped/'));
      return;
    }

    console.log(chalk.blue(`📄 Loading data from: ${dataFile}`));
    
    if (!fs.existsSync(dataFile)) {
      console.log(chalk.red(`❌ Data file not found: ${dataFile}`));
      return;
    }

    const rawData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    const faqs: FAQRecord[] = rawData.faqs || rawData;

    if (!Array.isArray(faqs) || faqs.length === 0) {
      console.log(chalk.red('❌ No FAQ data found in file'));
      return;
    }

    console.log(chalk.green(`📋 Found ${faqs.length} FAQ records`));

    // Show data preview
    if (faqs.length > 0) {
      console.log(chalk.yellow('Data preview:'));
      const categories = [...new Set(faqs.map(faq => faq.category))];
      console.log(`  Categories: ${categories.join(', ')}`);
      console.log(`  Sample record: ${faqs[0]._id} - ${faqs[0].chunk_text.substring(0, 100)}...`);
      console.log();
    }

    // Convert and upsert data
    const upsertRecords = pineconeStorage.convertFaqsToUpsertRecords(faqs);
    
    console.log(chalk.blue('📤 Uploading data with integrated embeddings...'));
    console.log(`  Processing ${upsertRecords.length} records in batches of ${batchSize}`);

    if (!options.dryRun) {
      const startTime = Date.now();
      
      const result = await pineconeStorage.batchUpsertRecords(
        indexName,
        upsertRecords,
        batchSize,
        namespace
      );

      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(chalk.green('✅ Data uploaded successfully'));
        console.log(`  Processed: ${result.processedCount} records`);
        console.log(`  Failed: ${result.failedCount} records`);
        console.log(`  Duration: ${duration}ms`);
      } else {
        console.log(chalk.red('❌ Upload failed'));
        console.log(`  Processed: ${result.processedCount} records`);
        console.log(`  Failed: ${result.failedCount} records`);
        if (result.errors.length > 0) {
          console.log('  Errors:');
          result.errors.forEach(error => {
            console.log(`    - ${error.message}`);
          });
        }
      }

      // Show final stats
      console.log(chalk.blue('📊 Final index statistics:'));
      const stats = await pineconeClient.getIndexStats(indexName);
      console.log(`  Total vectors: ${stats.totalVectorCount}`);
      console.log(`  Dimension: ${stats.dimension}`);
      console.log(`  Index fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
      console.log(`  Namespaces: ${Object.keys(stats.namespaces).join(', ')}`);
      
      if (stats.namespaces[namespace]) {
        console.log(`  Records in "${namespace}": ${stats.namespaces[namespace].vectorCount}`);
      }
    } else {
      console.log(chalk.gray('(Dry run) Would process records:'));
      console.log(`  - ${upsertRecords.length} records`);
      console.log(`  - ${Math.ceil(upsertRecords.length / batchSize)} batches`);
      console.log(`  - Estimated time: ${Math.ceil(upsertRecords.length / batchSize) * 2} seconds`);
    }

    console.log();
    console.log(chalk.green('🎉 Setup complete!'));
    console.log(chalk.gray('You can now use the search API to query your data.'));
    console.log(chalk.gray('Example: POST /api/search with {"query": "How do I make a payment?"}'));

  } catch (error) {
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
  console.log('        "category": "Category Name"');
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