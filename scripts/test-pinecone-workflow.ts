#!/usr/bin/env node
/**
 * Pinecone Workflow Test with Integrated Embeddings
 * 
 * This script comprehensively tests the Pinecone integration with integrated embeddings.
 * Can test against real Aven data or create separate test data.
 * 
 * Usage:
 *   npm run test:pinecone                                    # Test with sample data
 *   npm run test:pinecone -- --use-real-data                # Test against real Aven data
 *   npm run test:pinecone -- --skip-setup                   # Skip index creation
 *   npm run test:pinecone -- --index-name custom-test       # Custom index name
 */

import { Command } from 'commander';
import { PineconeClient, PineconeStorage, PineconeSearch } from '../src/lib/pinecone';
import { UpsertRecord, IndexConfig } from '../src/lib/pinecone/types';
import chalk from 'chalk';

// Test configuration for new test index
const TEST_CONFIG: IndexConfig = {
  name: 'test-integrated-embeddings',
  cloud: 'aws',
  region: 'us-east-1',
  model: 'llama-text-embed-v2',
  textField: 'chunk_text',
  waitUntilReady: true,
};

// Real Aven data configuration
const AVEN_CONFIG = {
  indexName: 'aven-support',
  namespace: 'default',
};

const TEST_NAMESPACE = 'test-namespace';

// Sample test data (only used if not testing against real data)
const SAMPLE_DATA: UpsertRecord[] = [
  {
    id: 'test-001',
    chunk_text: 'How do I make a payment using my credit card?',
    category: 'Payments',
    source: 'test-data',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'test-002',
    chunk_text: 'What documents do I need to apply for a loan?',
    category: 'Before You Apply',
    source: 'test-data',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'test-003',
    chunk_text: 'How can I check my account balance?',
    category: 'Account Management',
    source: 'test-data',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'test-004',
    chunk_text: 'What are the interest rates for personal loans?',
    category: 'Loans',
    source: 'test-data',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'test-005',
    chunk_text: 'How do I contact customer support?',
    category: 'Support',
    source: 'test-data',
    timestamp: new Date().toISOString(),
  },
];

async function main() {
  const program = new Command();
  
  program
    .name('test-pinecone-workflow')
    .description('Test Pinecone workflow with integrated embeddings')
    .option('--use-real-data', 'Test against real Aven data instead of creating test data')
    .option('--skip-setup', 'Skip index creation and data setup')
    .option('--index-name <name>', 'Index name for testing (ignored if using real data)')
    .option('--namespace <namespace>', 'Namespace for testing')
    .option('--cleanup', 'Clean up test data after testing (ignored if using real data)')
    .option('--performance', 'Run performance tests')
    .option('--verbose', 'Verbose output')
    .parse(process.argv);

  const options = program.opts();

  // Determine configuration based on whether we're using real data
  const useRealData = options.useRealData;
  const indexName = useRealData ? AVEN_CONFIG.indexName : (options.indexName || TEST_CONFIG.name);
  const namespace = useRealData ? AVEN_CONFIG.namespace : (options.namespace || TEST_NAMESPACE);

  console.log(chalk.blue('🧪 Pinecone Workflow Test with Integrated Embeddings'));
  console.log(chalk.gray('==================================================='));
  console.log();

  console.log(chalk.yellow('Test Configuration:'));
  console.log(`  Data Source: ${useRealData ? 'Real Aven Data' : 'Sample Test Data'}`);
  console.log(`  Index Name: ${indexName}`);
  console.log(`  Namespace: ${namespace}`);
  console.log(`  Model: ${TEST_CONFIG.model}`);
  console.log(`  Skip Setup: ${options.skipSetup ? 'Yes' : 'No'}`);
  console.log(`  Cleanup: ${!useRealData && options.cleanup ? 'Yes' : 'No'}`);
  console.log(`  Performance: ${options.performance ? 'Yes' : 'No'}`);
  console.log();

  if (useRealData) {
    console.log(chalk.blue('📋 Using real Aven FAQ data for testing'));
    console.log(chalk.yellow('⚠️  Note: Tests will be read-only against your production data'));
    console.log();
  }

  const testResults = {
    passed: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Initialize services
    const pineconeClient = PineconeClient.getInstance();
    const pineconeStorage = new PineconeStorage();
    const pineconeSearch = new PineconeSearch();

    // Test 1: Client Initialization
    await runTest('Client Initialization', async () => {
      const isInitialized = pineconeClient.isInitialized();
      if (!isInitialized) {
        throw new Error('Client not initialized');
      }
    }, testResults, options.verbose);

    // Test 2: Index Management (only if not using real data)
    if (!useRealData && !options.skipSetup) {
      await runTest('Index Creation', async () => {
        const exists = await pineconeClient.indexExists(indexName);
        if (exists) {
          console.log(chalk.yellow(`    Index ${indexName} already exists, deleting...`));
          await pineconeClient.deleteIndex(indexName);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        await pineconeClient.createIndexForModel({
          ...TEST_CONFIG,
          name: indexName,
        });
        
        const newExists = await pineconeClient.indexExists(indexName);
        if (!newExists) {
          throw new Error('Index was not created');
        }
      }, testResults, options.verbose);
    } else if (useRealData) {
      // Verify the real index exists
      await runTest('Real Index Verification', async () => {
        const exists = await pineconeClient.indexExists(indexName);
        if (!exists) {
          throw new Error(`Real index ${indexName} does not exist. Run setup:pinecone first.`);
        }
        console.log(chalk.gray(`    Verified real index ${indexName} exists`));
      }, testResults, options.verbose);
    }

    // Test 3: Index Statistics
    await runTest('Index Statistics', async () => {
      const stats = await pineconeClient.getIndexStats(indexName);
      if (typeof stats.dimension !== 'number') {
        throw new Error('Invalid index statistics');
      }
      console.log(chalk.gray(`    Dimension: ${stats.dimension}, Vectors: ${stats.totalVectorCount}`));
      
      if (useRealData) {
        console.log(chalk.gray(`    Real data namespaces: ${Object.keys(stats.namespaces).join(', ')}`));
        if (stats.namespaces[namespace]) {
          console.log(chalk.gray(`    Records in namespace "${namespace}": ${stats.namespaces[namespace].vectorCount}`));
        }
      }
    }, testResults, options.verbose);

    // Test 4: Data Upload (only if not using real data)
    if (!useRealData) {
      await runTest('Data Upload with Integrated Embeddings', async () => {
        const result = await pineconeStorage.upsertRecords(indexName, SAMPLE_DATA, namespace);
        if (!result.success) {
          throw new Error(`Upload failed: ${result.errors.map(e => e.message).join(', ')}`);
        }
        console.log(chalk.gray(`    Uploaded ${result.processedCount} records`));
      }, testResults, options.verbose);

      // Wait for indexing
      console.log(chalk.yellow('  ⏳ Waiting for data to be indexed...'));
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Test 5: Basic Semantic Search
    await runTest('Basic Semantic Search', async () => {
      const query = useRealData ? 'How do I make a payment?' : 'payment credit card';
      const results = await pineconeSearch.semanticSearch(indexName, query, {
        topK: 3,
        namespace,
      });
      
      if (results.results.length === 0) {
        throw new Error('No search results returned');
      }
      
      console.log(chalk.gray(`    Query: "${query}"`));
      console.log(chalk.gray(`    Found ${results.results.length} results`));
      console.log(chalk.gray(`    Top match: ${results.results[0].id} (score: ${results.results[0].score?.toFixed(4)})`));
      
      if (options.verbose && results.results[0].metadata?.chunk_text) {
        const preview = (results.results[0].metadata.chunk_text as string).substring(0, 100);
        console.log(chalk.gray(`    Preview: ${preview}...`));
      }
    }, testResults, options.verbose);

    // Test 6: Category Search
    await runTest('Category Search', async () => {
      let category = 'Payments';
      let query = 'payment';
      
      if (useRealData) {
        // Get available categories first
        const categories = await pineconeSearch.getCategories(indexName, namespace);
        if (categories.length > 0) {
          category = categories[0]; // Use first available category
          console.log(chalk.gray(`    Available categories: ${categories.join(', ')}`));
        }
      }
      
      const results = await pineconeSearch.categorySearch(indexName, query, {
        topK: 5,
        namespace,
        category,
      });
      
      if (results.results.length === 0) {
        console.log(chalk.yellow(`    No results found in category "${category}" - this may be expected`));
        return; // Don't fail the test if category doesn't exist in real data
      }
      
      console.log(chalk.gray(`    Found ${results.results.length} results in "${category}" category`));
    }, testResults, options.verbose);

    // Test 7: Multi-Category Search (adjusted for real data)
    await runTest('Multi-Category Search', async () => {
      let categories = ['Account Management', 'Support'];
      let query = 'account';
      
      if (useRealData) {
        // Get real categories
        const availableCategories = await pineconeSearch.getCategories(indexName, namespace);
        if (availableCategories.length >= 2) {
          categories = availableCategories.slice(0, 2);
        } else if (availableCategories.length === 1) {
          categories = availableCategories;
        }
        query = 'help'; // More generic query for real data
      }
      
      const results = await pineconeSearch.multiCategorySearch(
        indexName,
        query,
        categories,
        { topK: 5, namespace }
      );
      
      console.log(chalk.gray(`    Query: "${query}" in categories: [${categories.join(', ')}]`));
      console.log(chalk.gray(`    Found ${results.results.length} results in multiple categories`));
    }, testResults, options.verbose);

    // Test 8: Similar Document Search (adjusted for real data)
    await runTest('Similar Document Search', async () => {
      let documentId = 'test-001';
      
      if (useRealData) {
        // Get a real document ID from the search results
        const sampleSearch = await pineconeSearch.semanticSearch(indexName, 'payment', {
          topK: 1,
          namespace,
        });
        
        if (sampleSearch.results.length > 0) {
          documentId = sampleSearch.results[0].id;
        } else {
          console.log(chalk.yellow('    No documents found for similarity search'));
          return;
        }
      }
      
      const results = await pineconeSearch.findSimilar(indexName, documentId, {
        topK: 3,
        namespace,
      });
      
      console.log(chalk.gray(`    Finding similar to: ${documentId}`));
      console.log(chalk.gray(`    Found ${results.results.length} similar documents`));
    }, testResults, options.verbose);

    // Test 9: Search with Reranking
    await runTest('Search with Reranking', async () => {
      const query = useRealData ? 'loan application process' : 'loan documents';
      const results = await pineconeSearch.searchWithReranking(indexName, query, {
        topK: 3,
        namespace,
      });
      
      console.log(chalk.gray(`    Reranked query: "${query}"`));
      console.log(chalk.gray(`    Found ${results.results.length} reranked results`));
    }, testResults, options.verbose);

    // Test 10: Get Categories
    await runTest('Get Categories', async () => {
      const categories = await pineconeSearch.getCategories(indexName, namespace);
      
      if (categories.length === 0) {
        if (useRealData) {
          console.log(chalk.yellow('    No categories found in real data - check namespace'));
          return;
        } else {
          throw new Error('No categories found');
        }
      }
      
      console.log(chalk.gray(`    Found categories: ${categories.join(', ')}`));
    }, testResults, options.verbose);

    // Test 11: Category Counts
    await runTest('Category Counts', async () => {
      const counts = await pineconeSearch.countByCategory(indexName, namespace);
      
      if (Object.keys(counts).length === 0) {
        console.log(chalk.yellow('    No category counts available'));
        return;
      }
      
      console.log(chalk.gray(`    Category counts: ${JSON.stringify(counts)}`));
    }, testResults, options.verbose);

    // Performance Tests
    if (options.performance) {
      await runPerformanceTests(pineconeSearch, indexName, namespace, testResults, options.verbose, useRealData);
    }

    // Cleanup (only for test data)
    if (!useRealData && options.cleanup) {
      await runTest('Cleanup Test Data', async () => {
        await pineconeStorage.deleteAllRecords(indexName, namespace);
        console.log(chalk.gray('    Cleaned up test data'));
      }, testResults, options.verbose);
    }

    // Final Results
    console.log();
    console.log(chalk.blue('📊 Test Results'));
    console.log(chalk.gray('================'));
    console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
    console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
    console.log(chalk.blue(`📈 Total: ${testResults.passed + testResults.failed}`));
    
    if (testResults.errors.length > 0) {
      console.log();
      console.log(chalk.red('Errors:'));
      testResults.errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    if (testResults.failed === 0) {
      console.log();
      if (useRealData) {
        console.log(chalk.green('🎉 All tests passed! Your real Aven data is working perfectly with Pinecone.'));
        console.log(chalk.blue('✨ Your semantic search is ready for production use!'));
      } else {
        console.log(chalk.green('🎉 All tests passed! Pinecone integration is working correctly.'));
      }
    } else {
      console.log();
      console.log(chalk.red('❌ Some tests failed. Please check the errors above.'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('❌ Test suite failed:'), error);
    process.exit(1);
  }
}

async function runTest(
  testName: string,
  testFn: () => Promise<void>,
  results: { passed: number; failed: number; errors: string[] },
  verbose: boolean = false
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(chalk.blue(`🧪 ${testName}...`));
    await testFn();
    const duration = Date.now() - startTime;
    console.log(chalk.green(`✅ ${testName} passed (${duration}ms)`));
    results.passed++;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`❌ ${testName} failed (${duration}ms): ${errorMessage}`));
    results.failed++;
    results.errors.push(`${testName}: ${errorMessage}`);
    
    if (verbose) {
      console.log(chalk.red('  Stack trace:'), error);
    }
  }
}

async function runPerformanceTests(
  pineconeSearch: PineconeSearch,
  indexName: string,
  namespace: string,
  testResults: { passed: number; failed: number; errors: string[] },
  verbose: boolean,
  useRealData: boolean = false
): Promise<void> {
  console.log(chalk.yellow('🚀 Performance Tests'));
  console.log(chalk.gray('==================='));

  // Test search performance
  await runTest('Search Performance', async () => {
    const queries = useRealData 
      ? [
          'How do I make a payment?',
          'What are the loan requirements?',
          'How to check account balance?',
          'Contact customer support',
          'What are the interest rates?',
        ]
      : [
          'payment credit card',
          'loan application',
          'account balance',
          'customer support',
          'interest rates',
        ];

    const results = [];
    for (const query of queries) {
      const startTime = Date.now();
      const result = await pineconeSearch.semanticSearch(indexName, query, {
        topK: 5,
        namespace,
      });
      const duration = Date.now() - startTime;
      results.push({ query, duration, resultCount: result.results.length });
    }

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(chalk.gray(`    Average search time: ${avgDuration.toFixed(2)}ms`));
    console.log(chalk.gray(`    Fastest: ${Math.min(...results.map(r => r.duration))}ms`));
    console.log(chalk.gray(`    Slowest: ${Math.max(...results.map(r => r.duration))}ms`));

    if (avgDuration > 5000) {
      throw new Error(`Search performance too slow: ${avgDuration}ms average`);
    }
  }, testResults, verbose);

  // Only test batch upload performance if not using real data
  if (!useRealData) {
    await runTest('Batch Upload Performance', async () => {
      const batchData = Array.from({ length: 20 }, (_, i) => ({
        id: `perf-test-${i}`,
        chunk_text: `Performance test document ${i} with some content to embed`,
        category: `TestCategory${i % 5}`,
        source: 'performance-test',
        timestamp: new Date().toISOString(),
      }));

      const pineconeStorage = new PineconeStorage();
      const startTime = Date.now();
      const result = await pineconeStorage.batchUpsertRecords(indexName, batchData, 10, namespace);
      const duration = Date.now() - startTime;

      console.log(chalk.gray(`    Batch upload time: ${duration}ms`));
      console.log(chalk.gray(`    Records per second: ${((batchData.length / duration) * 1000).toFixed(2)}`));

      if (!result.success) {
        throw new Error(`Batch upload failed: ${result.errors.map(e => e.message).join(', ')}`);
      }
    }, testResults, verbose);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 