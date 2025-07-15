// Exa AI related types

export interface ExaSearchResult {
  id: string;
  url: string;
  title: string;
  score: number;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  summary?: any;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

export interface ExaContentOptions {
  text?: boolean;
  highlights?: {
    query: string;
    numSentences?: number;
    threshold?: number;
  };
  summary?: {
    query: string;
    schema?: any;
  };
}

export interface ScrapedFAQItem {
  _id: string;
  chunk_text: string;
  category: string;
  question: string;
}

export interface AvenSupportData {
  faqs: ScrapedFAQItem[];
  metadata: {
    scraped_at: string;
    source_url: string;
    total_items: number;
  };
}

export interface ExaClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export type AvenCategory = 
  | "Trending Articles"
  | "Application" 
  | "Payments"
  | "Before You Apply"
  | "Offer, Rates, & Fees"
  | "Account"
  | "Online Notary"
  | "Debt Protection"; 