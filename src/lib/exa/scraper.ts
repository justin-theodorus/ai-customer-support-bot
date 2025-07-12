import { exaClient } from "./client";
import { Logger } from "@/utils/logger";
import type { ScrapedFAQItem, AvenSupportData, AvenCategory } from "./types";

const logger = new Logger("AvenScraper");

export class AvenScraper {
  private readonly AVEN_SUPPORT_URL = "https://www.aven.com/support";
  
  /**
   * Scrape the Aven support page and extract FAQ content
   */
  async scrapeAvenSupport(): Promise<AvenSupportData> {
    try {
      logger.info("Starting Aven support page scraping...");

      // Get raw text content from EXA
      const result = await exaClient.getContents(
        [this.AVEN_SUPPORT_URL],
        {
          text: true,
        }
      );

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

      return scrapedData;

    } catch (error) {
      logger.error("Aven support scraping failed:", error);
      throw new Error(`Failed to scrape Aven support page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process raw text content to extract FAQ data
   */
  private processRawTextContent(text: string): Array<{_id: string, chunk_text: string, category: AvenCategory}> {
    const faqs: Array<{_id: string, chunk_text: string, category: AvenCategory}> = [];
    
    // Category mapping based on the sections in the Aven support page
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

    // Split text by category sections
    const categoryPattern = /##### ([^#\n]+)/g;
    let match;
    const sections: { category: string, content: string }[] = [];
    let lastIndex = 0;

    // Find all category headers
    while ((match = categoryPattern.exec(text)) !== null) {
      if (lastIndex > 0) {
        // Add the previous section's content
        const prevMatch = sections[sections.length - 1];
        if (prevMatch) {
          prevMatch.content = text.substring(lastIndex, match.index).trim();
        }
      }
      
      sections.push({
        category: match[1].trim(),
        content: ""
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Add content for the last section
    if (sections.length > 0) {
      sections[sections.length - 1].content = text.substring(lastIndex).trim();
    }

    let faqCounter = 1;

    // Process each section
    sections.forEach((section) => {
      const categoryName = section.category;
      const mappedCategory = categoryMappings[categoryName];
      
      if (!mappedCategory) {
        logger.warn(`Unknown category: ${categoryName}`);
        return;
      }

      // Extract FAQ items from section content
      // Pattern to match FAQ questions and answers - Fixed pattern to match: "- Question? ![down](URL)\nAnswer"
      const faqPattern = /- ([^?]+\?) !\[down\]\([^)]*\)\n([^]*?)(?=\n- |$)/gm;
      let faqMatch;

      while ((faqMatch = faqPattern.exec(section.content)) !== null) {
        const question = faqMatch[1].trim();
        let answer = faqMatch[2].trim();
        
        // Clean up the answer text
        answer = answer
          .replace(/\[iframe\][^[]*\[\/iframe\]/g, '') // Remove iframe content
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Convert markdown links to plain text
          .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // Remove images
          .replace(/\n+/g, ' ') // Replace multiple newlines with space
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        if (question && answer && answer.length > 10) { // Only include substantial answers
          faqs.push({
            _id: `aven_faq_${faqCounter}`,
            chunk_text: answer,
            category: mappedCategory
          });
          faqCounter++;
        }
      }
    });

    logger.info(`Extracted ${faqs.length} FAQ items from raw text`);
    return faqs;
  }

  /**
   * Validate and clean the extracted FAQ data
   */
  private validateAndCleanFAQs(faqs: Array<{_id: string, chunk_text: string, category: AvenCategory}>): ScrapedFAQItem[] {
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
        // Basic validation
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

        return true;
      })
      .map((faq, index) => {
        // Generate ID if not provided or invalid
        const id = faq._id && typeof faq._id === 'string' ? faq._id : `aven_faq_${index + 1}`;
        
        return {
          _id: id,
          chunk_text: faq.chunk_text.trim(),
          category: faq.category
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
  async scrapeWithRetry(maxRetries: number = 3): Promise<AvenSupportData> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.scrapeAvenSupport();
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