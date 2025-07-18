/**
 * Chat API with RAG (Retrieval-Augmented Generation)
 * Uses Pinecone semantic search + OpenAI for contextual responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pineconeSearch } from '@/lib/pinecone';
import { Logger } from '@/utils/logger';
import OpenAI from 'openai';

const logger = new Logger('API:Chat');

// Default configuration
const DEFAULT_INDEX_NAME = 'aven-support';
const DEFAULT_NAMESPACE = 'default';
const MAX_CONTEXT_LENGTH = 4000; // Max characters for context
const SEARCH_RESULTS_COUNT = 5; // Number of results to retrieve for context

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Request schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  indexName: z.string().optional(),
  namespace: z.string().optional(),
  includeContext: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  model: z.string().optional(),
});

// System prompt for Aven customer support
const SYSTEM_PROMPT = `You are an AI customer support assistant for Aven, a financial services company. You help customers with questions about loans, payments, account management, and other financial services.

Guidelines:
- Always be helpful, professional, and friendly
- Use the provided context from Aven's support documents to answer questions accurately
- If you don't have enough information in the context, politely say so and suggest contacting customer support
- For financial advice or complex situations, recommend speaking with a financial advisor
- Keep responses concise but comprehensive
- When referencing specific procedures or policies, cite the relevant information from the context

Context from Aven's knowledge base will be provided below. Use this information to answer the user's question.`;

/**
 * POST /api/chat - Generate AI response with RAG
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversation = [],
      indexName,
      namespace,
      includeContext = true,
      temperature = 0.7,
      model = 'gpt-4o-mini',
    } = ChatRequestSchema.parse(body);

    const finalIndexName = indexName || DEFAULT_INDEX_NAME;
    const finalNamespace = namespace || DEFAULT_NAMESPACE;

    logger.info('Processing chat request', {
      messageLength: message.length,
      conversationLength: conversation.length,
      includeContext,
      model,
    });

    let context = '';
    let searchResults: unknown = null;

    // Retrieve context using semantic search
    if (includeContext) {
      try {
        logger.info('Performing semantic search for context');
        
        const searchResponse = await pineconeSearch.semanticSearch(
          finalIndexName,
          message,
          {
            topK: SEARCH_RESULTS_COUNT,
            namespace: finalNamespace,
            includeMetadata: true,
          }
        );

        // NEW: Log the details of the chunks returned from Pinecone
        logger.info('Semantic search results retrieved', {
          resultsCount: searchResponse.results.length,
          returnedChunks: searchResponse.results.map(r => ({
              id: r.id,
              score: r.score,
              question: r.metadata?.question,
          })),
        });

        searchResults = searchResponse;

        if (searchResponse.results.length > 0) {
          // Build context from search results
          const contextParts = searchResponse.results.map((result, index) => {
            const text = result.metadata?.original_text || result.metadata?.chunk_text || '';
            const category = result.metadata?.category || 'General';
            const score = result.score?.toFixed(3) || '0.000';
            
            return `[Context ${index + 1} - ${category} (relevance: ${score})]:\n${text}`;
          });

          context = contextParts.join('\n\n').substring(0, MAX_CONTEXT_LENGTH);
          
          logger.info('Context prepared for LLM', {
            resultsCount: searchResponse.results.length,
            contextLength: context.length,
          });
        } else {
          logger.warn('No search results found for context');
        }
      } catch (searchError) {
        logger.error('Error retrieving context', { error: searchError });
        // Continue without context rather than failing
      }
    }

    // ... (The rest of your function remains the same)
    
    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: context 
          ? `${SYSTEM_PROMPT}\n\nRelevant context from Aven's knowledge base:\n\n${context}`
          : SYSTEM_PROMPT,
      },
      ...conversation.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    logger.info('Generating OpenAI response', {
      messagesCount: messages.length,
      model,
      temperature,
    });

    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: 1000,
      stream: false,
    });

    const responseTime = Date.now() - startTime;
    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    logger.info('Response generated successfully', {
      responseTime,
      responseLength: aiResponse.length,
      tokensUsed: completion.usage?.total_tokens || 0,
    });

    return NextResponse.json({
      success: true,
      message: aiResponse,
      metadata: {
        model,
        responseTime,
        tokensUsed: completion.usage?.total_tokens || 0,
        contextUsed: !!context,
        searchResults: searchResults ? {
          count: searchResults.results.length,
          processingTime: searchResults.processingTime,
          topScore: searchResults.results[0]?.score || 0,
        } : null,
      },
      indexName: finalIndexName,
      namespace: finalNamespace,
    });

  } catch (error) {
    logger.error('Error processing chat request', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API configuration error', message: 'Please check your OpenAI API key' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat - Get chat API information
 */
export async function GET() {
  try {
    return NextResponse.json({
      message: 'Aven AI Customer Support Chat API',
      description: 'RAG-powered chat using Pinecone semantic search and OpenAI',
      endpoints: {
        'POST /api/chat': {
          description: 'Send a chat message and get an AI response with context',
          body: {
            message: 'string (required) - User message',
            conversation: 'array (optional) - Previous conversation history',
            indexName: 'string (optional) - Pinecone index name',
            namespace: 'string (optional) - Pinecone namespace',
            includeContext: 'boolean (optional) - Whether to use RAG context',
            temperature: 'number (optional) - AI creativity (0-2)',
            model: 'string (optional) - OpenAI model to use',
          },
        },
      },
      configuration: {
        defaultIndex: DEFAULT_INDEX_NAME,
        defaultNamespace: DEFAULT_NAMESPACE,
        maxContextLength: MAX_CONTEXT_LENGTH,
        searchResultsCount: SEARCH_RESULTS_COUNT,
        supportedModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
      },
      examples: {
        simple_question: {
          message: 'How do I make a payment?',
        },
        with_conversation: {
          message: 'What about international payments?',
          conversation: [
            { role: 'user', content: 'How do I make a payment?' },
            { role: 'assistant', content: 'You can make payments through...' },
          ],
        },
        without_context: {
          message: 'Hello!',
          includeContext: false,
        },
      },
    });

  } catch (error) {
    logger.error('Error getting chat API information', { error });
    
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 