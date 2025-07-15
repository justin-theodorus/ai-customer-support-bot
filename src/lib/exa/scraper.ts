import { exaClient } from "./client";
import { Logger } from "@/utils/logger";
import type { ScrapedFAQItem, AvenSupportData, AvenCategory } from "./types";

const logger = new Logger("AvenScraper");

export class AvenScraper {
  private readonly AVEN_SUPPORT_URL = "https://www.aven.com/support";
  
  /**
   * Scrape the Aven support page and extract FAQ content
   */
  async scrapeAvenSupport(saveRawResult: boolean = true, saveProcessedResult: boolean = true): Promise<AvenSupportData> {
    try {
      logger.info("Starting Aven support page scraping...");

      // Get raw text content from EXA
      const result = await exaClient.getContents(
        [this.AVEN_SUPPORT_URL],
        {
          text: true,
        }
      );

      // Save raw EXA result before processing (if enabled)
      if (saveRawResult) {
        await this.saveRawExaResult(result);
      }

      if (!result || !result.results || result.results.length === 0) {
        throw new Error("No content retrieved from Aven support page");
      }

      const content = result.results[0];
      
      if (!content.text) {
        throw new Error("No text content retrieved from Aven support page");
      }

      logger.info(`Retrieved ${content.text.length} characters of raw text`);

      // Process the raw text content to extract FAQs
      const extractedFAQs = this.processRawTextContent(content.text);

      // Validate and clean the extracted data
      const validatedFAQs = this.validateAndCleanFAQs(extractedFAQs);

      const scrapedData: AvenSupportData = {
        faqs: validatedFAQs,
        metadata: {
          scraped_at: new Date().toISOString(),
          source_url: this.AVEN_SUPPORT_URL,
          total_items: validatedFAQs.length
        }
      };

      logger.info(`Successfully scraped ${validatedFAQs.length} FAQ items from Aven support page`);
      
      // Log category distribution
      const categoryStats = this.getCategoryStats(validatedFAQs);
      logger.info("Category distribution:", categoryStats);

      // Save processed data (if enabled)
      if (saveProcessedResult) {
        await this.saveScrapedData(scrapedData);
      }

      return scrapedData;

    } catch (error) {
      logger.error("Aven support scraping failed:", error);
      throw new Error(`Failed to scrape Aven support page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

/**
   * Process raw text content to extract FAQ data structured for Pinecone.
   */
  private processRawTextContent(text: string): Array<{_id: string, chunk_text: string, category: AvenCategory, question: string}> {
    const mainContent = text.split(/## How can we help\?/i)[1] ?? '';
    const cleanText = mainContent
      .replace(/SHOW MORE/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[iframe\].*?(\n|$)/g, '');

    const faqs: Array<{_id: string, chunk_text: string, category: AvenCategory, question: string}> = [];
    const categoryMappings: Record<string, AvenCategory> = {
      "Trending Articles": "Trending Articles",
      "Payments": "Payments",
      "Before You Apply": "Before You Apply",
      "Offer, Rates & Fees": "Offer, Rates, & Fees",
      "Application": "Application",
      "Account": "Account",
      "Online Notary": "Online Notary",
      "Debt Protection": "Debt Protection"
    };

    const sections = cleanText.split(/#####[\s\S]*?(.*?)\n/);
    let faqCounter = 1;

    for (let i = 1; i < sections.length; i += 2) {
      const categoryName = sections[i].trim();
      const content = sections[i + 1] || '';
      const mappedCategory = categoryMappings[categoryName];

      if (!mappedCategory) continue;
      
      // FIX #2: More flexible splitting for Q&A pairs.
      // Splits on a "- " that is followed by a question, even if it's not on a new line.
      const qaPairs = content.trim().split(/\n\s*(?=-\s+[^\n]+\?)/g);

      for (const pair of qaPairs) {
        if (!pair.includes('?')) continue;
        
        // FIX #1: More robust slicing using the index of '?'
        const questionMarkIndex = pair.indexOf('?');
        const question = pair.substring(0, questionMarkIndex + 1).replace(/-\s*/, '').trim();
        let answer = pair.substring(questionMarkIndex + 1).trim();
        
        answer = answer
           .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
           .replace(/\s+/g, ' ')
            .trim();

        if (question.length > 5 && answer.length > 5) {
          faqs.push({
            _id: `aven_faq_${faqCounter++}`,
            chunk_text: `Question: ${question}\n\nAnswer: ${answer}`,
            category: mappedCategory,
            question: question
          });
        }
      }
    }

    logger.info(`Extracted ${faqs.length} FAQ items from raw text`);
    return faqs;
  }

/**
   * Validate and clean the extracted FAQ data
   */
private validateAndCleanFAQs(
  // Change #1: Update the parameter type to include 'question'
  faqs: Array<{_id: string, chunk_text: string, category: AvenCategory, question: string}>
): ScrapedFAQItem[] {
  const validCategories: AvenCategory[] = [
    "Trending Articles",
    "Application", 
    "Payments",
    "Before You Apply",
    "Offer, Rates, & Fees",
    "Account",
    "Online Notary",
    "Debt Protection"
  ];

  return faqs
    .filter((faq, index) => {
      // ... your existing filter logic is fine ...
      if (!faq || typeof faq !== 'object') {
        logger.warn(`Invalid FAQ object at index ${index}`);
        return false;
      }
      if (!faq.chunk_text || typeof faq.chunk_text !== 'string' || faq.chunk_text.trim().length === 0) {
        logger.warn(`Invalid chunk_text at index ${index}`);
        return false;
      }
      if (!faq.category || !validCategories.includes(faq.category)) {
        logger.warn(`Invalid category "${faq.category}" at index ${index}`);
        return false;
      }
      // Also a good idea to validate the question property
      if (!faq.question || typeof faq.question !== 'string' || faq.question.trim().length === 0) {
          logger.warn(`Invalid question at index ${index}`);
          return false;
      }
      return true;
    })
    .map((faq, index) => {
      const id = faq._id && typeof faq._id === 'string' ? faq._id : `aven_faq_${index + 1}`;
      
      return {
        _id: id,
        chunk_text: faq.chunk_text.trim(),
        category: faq.category,
        // Change #2: Add the 'question' property to the final object
        question: faq.question
      };
    });
}

  /**
   * Get statistics about category distribution
   */
  private getCategoryStats(faqs: ScrapedFAQItem[]): Record<string, number> {
    return faqs.reduce((stats, faq) => {
      stats[faq.category] = (stats[faq.category] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }

  /**
   * Scrape with retry logic
   */
  async scrapeWithRetry(maxRetries: number = 3, saveRawResult: boolean = true, saveProcessedResult: boolean = true): Promise<AvenSupportData> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.scrapeAvenSupport(saveRawResult, saveProcessedResult);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }
        
        logger.warn(`Scraping attempt ${attempt} failed, retrying...`, error);
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Save scraped data to file system (for backup/debugging)
   */
  async saveScrapedData(data: AvenSupportData, filename?: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = filename || `aven-support-scraped-${timestamp}.json`;
    const dataDir = path.join(process.cwd(), 'data', 'scraped');
    
    // Ensure directory exists
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
    
    const filePath = path.join(dataDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    logger.info(`Scraped data saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Save raw EXA result to file
   */
  private async saveRawExaResult(result: import('./types').ExaSearchResponse): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `aven-support-raw-exa-${timestamp}.json`;
    const dataDir = path.join(process.cwd(), 'data', 'raw');

    // Ensure directory exists
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    const filePath = path.join(dataDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
    logger.info(`Raw EXA result saved to: ${filePath}`);
  }

  /**
   * Load previously scraped data from file
   */
  async loadScrapedData(filePath: string): Promise<AvenSupportData> {
    const fs = await import('fs/promises');
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as AvenSupportData;
    } catch (error) {
      logger.error(`Failed to load scraped data from ${filePath}:`, error);
      throw new Error(`Failed to load scraped data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create a singleton instance
export const avenScraper = new AvenScraper(); 