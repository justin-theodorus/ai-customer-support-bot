#!/usr/bin/env tsx

// Initial Scraping Script for Aven Support Page

import { Logger } from "../src/utils/logger";
import path from "path";
import fs from "fs";

const logger = new Logger("InitialScrapeScript");

interface ScrapingConfig {
  maxRetries: number;
  saveToFile: boolean;
  outputDir: string;
  validateResults: boolean;
  logLevel: string;
}

class InitialScrapingRunner {
  private config: ScrapingConfig;

  constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = {
      maxRetries: 3,
      saveToFile: true,
      outputDir: path.join(process.cwd(), 'data', 'scraped'),
      validateResults: true,
      logLevel: 'info',
      ...config,
    };
  }

  async run(): Promise<void> {
    console.log("🚀 Starting Aven Support Page Initial Scraping");
    console.log("================================================");
    console.log(`Target URL: https://www.aven.com/support`);
    console.log(`Max Retries: ${this.config.maxRetries}`);
    console.log(`Output Directory: ${this.config.outputDir}`);
    console.log("");

    const startTime = Date.now();

    try {
      // Step 1: Scrape the data via API
      console.log("📡 Step 1: Scraping Aven support page via API...");
      const scrapedData = await this.callScrapeAPI();

      // Step 2: Validate results
      if (this.config.validateResults) {
        console.log("✅ Step 2: Validating scraped data...");
        this.validateScrapedData(scrapedData);
      }

      // Step 3: Save to file (if not already saved by API)
      let savedPath: string | null = scrapedData.saved_file || null;
      if (this.config.saveToFile && !savedPath) {
        console.log("💾 Step 3: Saving scraped data...");
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `aven-support-initial-${timestamp}.json`;
        savedPath = await this.saveScrapedData(scrapedData, filename);
        console.log(`✅ Data saved to: ${savedPath}`);
      } else if (savedPath) {
        console.log(`✅ Data already saved to: ${savedPath}`);
      }

      // Step 4: Generate report
      console.log("📊 Step 4: Generating report...");
      this.generateReport(scrapedData, Date.now() - startTime);

      console.log("");
      console.log("🎉 Initial scraping completed successfully!");

    } catch (error) {
      console.error("❌ Scraping failed:", error);
      process.exit(1);
    }
  }

  /**
   * Call the scrape API endpoint
   */
  private async callScrapeAPI(): Promise<any> {
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const endpoint = `${apiUrl}/api/scrape`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxRetries: this.config.maxRetries,
        saveToFile: this.config.saveToFile,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Scrape API failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Scrape API returned error: ${result.message || 'Unknown error'}`);
    }

    // Transform API response to match expected format
    return {
      faqs: result.faqs,
      metadata: result.data.metadata,
      saved_file: result.data.saved_file,
    };
  }

  /**
   * Save scraped data to file system (fallback if API didn't save)
   */
  private async saveScrapedData(data: any, filename: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = filename || `aven-support-scraped-${timestamp}.json`;
    const dataDir = this.config.outputDir;
    
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`Scraped data saved to: ${filePath}`);
    return filePath;
  }

  private validateScrapedData(data: any): void {
    const issues: string[] = [];

    // Check basic structure
    if (!data.faqs || !Array.isArray(data.faqs)) {
      issues.push("Missing or invalid 'faqs' array");
    }

    if (!data.metadata) {
      issues.push("Missing metadata");
    }

    // Check FAQ items
    if (data.faqs) {
      data.faqs.forEach((faq: any, index: number) => {
        if (!faq._id) {
          issues.push(`FAQ ${index}: Missing _id`);
        }
        if (!faq.chunk_text || faq.chunk_text.trim().length === 0) {
          issues.push(`FAQ ${index}: Missing or empty chunk_text`);
        }
        if (!faq.category) {
          issues.push(`FAQ ${index}: Missing category`);
        }
      });
    }

    // Check for minimum data requirements
    if (data.faqs && data.faqs.length < 5) {
      issues.push(`Too few FAQs extracted (${data.faqs.length}). Expected at least 5.`);
    }

    if (issues.length > 0) {
      console.warn("⚠️  Validation warnings:");
      issues.forEach(issue => console.warn(`   - ${issue}`));
      console.log("");
    } else {
      console.log("✅ Data validation passed");
    }
  }

  private generateReport(data: any, durationMs: number): void {
    console.log("📈 SCRAPING REPORT");
    console.log("==================");
    console.log(`Duration: ${(durationMs / 1000).toFixed(2)} seconds`);
    console.log(`Total FAQs: ${data.faqs?.length || 0}`);
    console.log(`Source URL: ${data.metadata?.source_url || 'N/A'}`);
    console.log(`Scraped at: ${data.metadata?.scraped_at || 'N/A'}`);
    
    // Category breakdown
    if (data.faqs && data.faqs.length > 0) {
      console.log("");
      console.log("📊 Category Breakdown:");
      const categoryStats = data.faqs.reduce((stats: Record<string, number>, faq: any) => {
        stats[faq.category] = (stats[faq.category] || 0) + 1;
        return stats;
      }, {});
      
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} FAQs`);
      });
    }

    // Sample FAQ
    if (data.faqs && data.faqs.length > 0) {
      console.log("");
      console.log("📝 Sample FAQ:");
      const sampleFaq = data.faqs[0];
      console.log(`   ID: ${sampleFaq._id}`);
      console.log(`   Category: ${sampleFaq.category}`);
      console.log(`   Text: ${sampleFaq.chunk_text.substring(0, 100)}...`);
    }

    console.log("");
    console.log("🎯 Next Steps:");
    console.log("   1. Review the scraped data quality");
    console.log("   2. Process and chunk the content (Phase 3)");
    console.log("   3. Generate embeddings and store in Pinecone (Phase 4)");
    console.log("   4. Test the RAG pipeline (Phase 5)");
  }
}

// CLI argument parsing
function parseCliArgs(): Partial<ScrapingConfig> {
  const args = process.argv.slice(2);
  const config: Partial<ScrapingConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--max-retries':
        config.maxRetries = parseInt(args[++i]);
        break;
      case '--no-save':
        config.saveToFile = false;
        break;
      case '--output-dir':
        config.outputDir = args[++i];
        break;
      case '--no-validate':
        config.validateResults = false;
        break;
      case '--log-level':
        config.logLevel = args[++i];
        break;
      case '--help':
        console.log(`
Aven Support Page Initial Scraping Script

Usage: npx tsx scripts/initial-scrape.ts [options]

Options:
  --max-retries <number>    Maximum retry attempts (default: 3)
  --no-save                 Don't save results to file
  --output-dir <path>       Output directory (default: data/scraped)
  --no-validate             Skip data validation
  --log-level <level>       Log level (default: info)
  --help                    Show this help message

Examples:
  npx tsx scripts/initial-scrape.ts
  npx tsx scripts/initial-scrape.ts --max-retries 5 --output-dir ./custom-output
  npx tsx scripts/initial-scrape.ts --no-save --no-validate
        `);
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`Unknown option: ${arg}. Use --help for available options.`);
        }
        break;
    }
  }

  return config;
}

// Main execution
async function main() {
  try {
    const config = parseCliArgs();
    const runner = new InitialScrapingRunner(config);
    await runner.run();
  } catch (error) {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { InitialScrapingRunner }; 