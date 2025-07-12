import { NextRequest, NextResponse } from "next/server";
import { avenScraper } from "@/lib/exa/scraper";
import { Logger } from "@/utils/logger";

const logger = new Logger("ScrapeAPI");

export async function POST(request: NextRequest) {
  try {
    logger.info("Scraping API endpoint called");

    // Parse request body for any options
    const body = await request.json().catch(() => ({}));
    const { 
      saveToFile = true, 
      maxRetries = 3,
      filename 
    } = body;

    // Start scraping process
    const startTime = Date.now();
    
    logger.info("Starting Aven support page scraping...");
    
    const scrapedData = await avenScraper.scrapeWithRetry(maxRetries);
    
    // Save to file if requested
    let savedFilePath: string | null = null;
    if (saveToFile) {
      savedFilePath = await avenScraper.saveScrapedData(scrapedData, filename);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = {
      success: true,
      message: "Aven support page scraped successfully",
      data: {
        metadata: scrapedData.metadata,
        stats: {
          total_faqs: scrapedData.faqs.length,
          categories: Object.keys(
            scrapedData.faqs.reduce((acc, faq) => {
              acc[faq.category] = true;
              return acc;
            }, {} as Record<string, boolean>)
          ),
          duration_ms: duration,
        },
        saved_file: savedFilePath,
      },
      // Include actual FAQ data in response (can be large)
      faqs: scrapedData.faqs,
    };

    logger.info(`Scraping completed successfully in ${duration}ms`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logger.error("Scraping API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      {
        success: false,
        error: "Scraping failed",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check for scraping service
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'health') {
      // Simple health check
      return NextResponse.json({
        success: true,
        message: "Scraping service is healthy",
        timestamp: new Date().toISOString(),
        endpoints: {
          POST: "/api/scrape - Trigger scraping",
          "GET?action=health": "/api/scrape?action=health - Health check",
          "GET?action=status": "/api/scrape?action=status - Service status",
        },
      });
    }

    if (action === 'status') {
      // Return service status and capabilities
      return NextResponse.json({
        success: true,
        status: "ready",
        capabilities: {
          target_url: "https://www.aven.com/support",
          supported_categories: [
            "Trending Articles",
            "Application", 
            "Payments",
            "Before You Apply",
            "Offer, Rates, & Fees",
            "Account",
            "Online Notary",
            "Debt Protection"
          ],
          features: [
            "FAQ extraction",
            "Category classification", 
            "Data validation",
            "File backup",
            "Retry logic",
            "Progress tracking"
          ]
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Default GET response
    return NextResponse.json({
      success: true,
      message: "Aven Support Scraping API",
      usage: {
        POST: "Trigger scraping of Aven support page",
        "GET?action=health": "Check service health",
        "GET?action=status": "Get service status and capabilities"
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Scraping API GET error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 