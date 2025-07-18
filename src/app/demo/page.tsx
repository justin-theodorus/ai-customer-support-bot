import { ChatBot } from '@/components/ChatBot';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Database, Zap } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Code className="h-10 w-10 text-purple-600 dark:text-purple-400 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Aven AI Chatbot - Demo & Testing
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Development interface with detailed metadata, performance metrics, and technical information.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Technical Information Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                  <Database className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pinecone Index:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">aven-support</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">AI Model:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">GPT-4o-mini</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Embedding:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">Llama-2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">RAG Context:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">5 results</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                  Features Enabled
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Metadata Display</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Response Timing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Token Usage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Context Scores</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Search Metrics</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Test Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-800 dark:text-blue-300">
                  <strong>Payment:</strong> &ldquo;How do I make a payment online?&rdquo;
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-800 dark:text-green-300">
                  <strong>Loans:</strong> &ldquo;What documents are needed for a loan application?&rdquo;
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-purple-800 dark:text-purple-300">
                  <strong>Account:</strong> &ldquo;How do I reset my password?&rdquo;
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-orange-800 dark:text-orange-300">
                  <strong>Rates:</strong> &ldquo;What are your current interest rates?&rdquo;
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <a 
                    href="/api/chat" 
                    target="_blank" 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    /api/chat
                  </a>
                  <p className="text-gray-600 dark:text-gray-400">Chat API with RAG</p>
                </div>
                <div>
                  <a 
                    href="/api/search" 
                    target="_blank" 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    /api/search
                  </a>
                  <p className="text-gray-600 dark:text-gray-400">Semantic search</p>
                </div>
                <div>
                  <a 
                    href="/api/embeddings" 
                    target="_blank" 
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    /api/embeddings
                  </a>
                  <p className="text-gray-600 dark:text-gray-400">Vector operations</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatBot 
              className="h-[800px]"
              showMetadata={true}
              initialMessage="🔧 **Development Mode Active**

Hello! This is the Aven AI support assistant running in development mode with detailed metadata enabled. 

**What you'll see:**
• Response times and token usage
• Search result counts and relevance scores  
• Context utilization indicators
• Technical performance metrics

**Try asking about:**
• Payment processes and options
• Loan application requirements
• Account management features
• Interest rates and fees
• General Aven policies

The metadata will show you exactly how the RAG system retrieves and uses context to generate responses."
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Expected Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">~1-3s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">100-500</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tokens Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">5</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Context Results</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">0.7-0.9</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Top Relevance Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 