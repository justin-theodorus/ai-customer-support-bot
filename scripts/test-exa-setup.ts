#!/usr/bin/env tsx

/**
 * Test Script for Exa AI Setup
 * 
 * This script verifies that the Exa AI integration is properly configured
 * and can connect to the API successfully.
 * 
 * Usage: npx tsx scripts/test-exa-setup.ts
 */

import { exaClient } from "../src/lib/exa/client";
import { Logger } from "../src/utils/logger";

const logger = new Logger("ExaSetupTest");

async function testExaConnection() {
  console.log("🧪 Testing Exa AI Setup");
  console.log("========================");
  console.log("");

  try {
    // Test 1: Health check
    console.log("1️⃣  Testing Exa API connection...");
    const isHealthy = await exaClient.healthCheck();
    
    if (isHealthy) {
      console.log("✅ Exa API connection successful");
    } else {
      console.log("❌ Exa API connection failed");
      return false;
    }

    // Test 2: Simple search
    console.log("2️⃣  Testing search functionality...");
    const searchResult = await exaClient.search("test query", { 
      numResults: 1,
      type: "neural" 
    });
    
    if (searchResult && searchResult.results && searchResult.results.length > 0) {
      console.log("✅ Search functionality working");
      console.log(`   Found ${searchResult.results.length} result(s)`);
    } else {
      console.log("❌ Search functionality failed or returned no results");
      return false;
    }

    // Test 3: Content retrieval
    console.log("3️⃣  Testing content retrieval...");
    try {
      const contentResult = await exaClient.getContents(
        ["https://example.com"],
        { text: true }
      );
      
      if (contentResult && contentResult.results) {
        console.log("✅ Content retrieval working");
      } else {
        console.log("⚠️  Content retrieval returned no results (this may be normal)");
      }
    } catch (error) {
      console.log("⚠️  Content retrieval test failed (this may be normal for some URLs)");
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log("");
    console.log("🎉 Exa AI setup test completed successfully!");
    console.log("");
    console.log("🚀 Next steps:");
    console.log("   1. Run the initial scraping: npm run script:initial-scrape");
    console.log("   2. Test with Aven support page: npm run test:scrape");
    console.log("   3. Monitor the logs for any issues");

    return true;

  } catch (error) {
    console.error("❌ Exa AI setup test failed:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        console.log("");
        console.log("💡 Troubleshooting tips:");
        console.log("   - Check your EXA_API_KEY in the .env file");
        console.log("   - Ensure the API key is valid and not expired");
        console.log("   - Verify the API key has proper permissions");
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        console.log("");
        console.log("💡 Troubleshooting tips:");
        console.log("   - Check your internet connection");
        console.log("   - Verify firewall settings allow outbound HTTPS requests");
        console.log("   - Try again in a few minutes in case of temporary service issues");
      }
    }

    return false;
  }
}

async function main() {
  const success = await testExaConnection();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
} 