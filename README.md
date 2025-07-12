# Aven AI Support Chatbot

A sophisticated AI-powered customer support chatbot for Aven Financial Services, built with Next.js, OpenAI, and Pinecone vector database. Features advanced RAG (Retrieval-Augmented Generation) technology for accurate, contextual responses.

## 🚀 Features

- **🤖 AI-Powered Conversations** - Natural language processing with OpenAI GPT-4o-mini
- **🔍 Semantic Search** - Advanced vector search using Pinecone with Llama-2 embeddings
- **📚 RAG Technology** - Retrieval-Augmented Generation for contextually accurate responses
- **💬 Real-time Chat** - Responsive chat interface with message history
- **🎯 Domain-Specific** - Trained on Aven's actual support documentation
- **🔧 Developer Mode** - Detailed metadata and performance metrics for development

## 🏗️ Architecture

```
User Question → Semantic Search (Pinecone) → Context Retrieval → OpenAI API → AI Response
                      ↓
              Aven Support Documents (Vector Database)
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **AI Models**: OpenAI GPT-4o-mini, Llama-2 embeddings
- **Vector Database**: Pinecone with integrated embeddings
- **Data Source**: Exa AI web scraping of Aven support pages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Pinecone API key
- Exa AI API key (for data scraping)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd nextjs-template
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env.local
```

Add your API keys to `.env.local`:
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key_here

# Exa AI (for data scraping)
EXA_API_KEY=your_exa_api_key_here
```

3. **Set up the vector database** (if not already done)
```bash
# Scrape Aven support data
npm run script:initial-scrape

# Create Pinecone index and upload data
npm run setup:pinecone

# Test the complete pipeline
npm run test:pinecone
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
- Main chatbot interface: http://localhost:3000
- Developer demo: http://localhost:3000/demo

## 💬 Using the Chatbot

### Main Interface

Navigate to the home page to access the production-ready chatbot interface:
- Clean, user-friendly design
- Natural conversation flow
- Contextual responses about Aven services

### Developer Interface

Visit `/demo` for the development interface with detailed metrics:
- Response timing and token usage
- Search result scores and context utilization
- Technical performance indicators
- API endpoint information

### Example Questions

Try asking the chatbot:
- "How do I make a payment?"
- "What documents do I need for a loan application?"
- "How can I check my account balance?"
- "What are your current interest rates?"
- "How do I contact customer support?"

## 🔧 API Endpoints

### Chat API
**POST** `/api/chat`

Generate AI responses with RAG context:

```typescript
{
  message: string,                    // User's question
  conversation?: Array<{              // Optional conversation history
    role: 'user' | 'assistant',
    content: string
  }>,
  includeContext?: boolean,           // Enable RAG (default: true)
  temperature?: number,               // AI creativity (0-2, default: 0.7)
  model?: string                      // OpenAI model (default: gpt-4o-mini)
}
```

### Search API
**POST** `/api/search`

Direct semantic search access:

```typescript
{
  query: string,                      // Search query
  topK?: number,                      // Number of results (default: 10)
  category?: string,                  // Filter by category
  searchType?: 'semantic' | 'category' | 'hybrid'
}
```

## 🎯 How RAG Works

1. **User asks a question** → "How do I make a payment?"

2. **Semantic search** → System searches Pinecone vector database for relevant context

3. **Context retrieval** → Top 5 most relevant support articles are retrieved

4. **AI generation** → OpenAI generates response using both the question and retrieved context

5. **Response delivery** → User receives accurate, contextual answer based on actual Aven documentation

## 📊 Performance Metrics

- **Response Time**: ~1-3 seconds
- **Token Usage**: 100-500 tokens per response
- **Context Results**: 5 relevant documents retrieved
- **Relevance Scores**: Typically 0.7-0.9 for good matches

## 🔒 Security & Privacy

- No conversation data is stored permanently
- API keys are securely handled via environment variables
- All communications are encrypted in transit
- Pinecone data is isolated per namespace

## 🛠️ Development Commands

```bash
# Data Pipeline
npm run script:initial-scrape    # Scrape Aven support pages
npm run setup:pinecone          # Set up vector database
npm run test:pinecone           # Test Pinecone integration

# Development
npm run dev                     # Start development server
npm run build                   # Build for production
npm run start                   # Start production server
npm run lint                    # Run ESLint
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # RAG chat endpoint
│   │   ├── search/route.ts        # Semantic search API
│   │   └── embeddings/route.ts    # Vector operations
│   ├── demo/page.tsx              # Developer interface
│   └── page.tsx                   # Main chatbot interface
├── components/
│   ├── ChatBot.tsx                # Main chat component
│   └── ui/                        # shadcn/ui components
└── lib/
    ├── pinecone/                  # Vector database integration
    ├── exa/                       # Web scraping utilities
    └── utils.ts                   # Shared utilities
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For technical issues or questions:
1. Check the `/demo` page for debugging information
2. Review API endpoint responses at `/api/chat` and `/api/search`
3. Check the browser console for detailed error messages
4. Ensure all environment variables are properly configured

---

Built with ❤️ using Next.js, OpenAI, and Pinecone
