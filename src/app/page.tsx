import { ChatBot } from '@/components/ChatBot';
import { ThemeToggle } from '@/components/theme-toggle';
import { Bot, MessageSquare, Zap, Shield, Search, Brain } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Aven AI Support Assistant
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get instant, intelligent answers to your questions about Aven's financial services. 
            Powered by advanced AI and real-time access to our knowledge base.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Features Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Search className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Semantic Search</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Finds relevant information using meaning, not just keywords</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">RAG Technology</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Retrieval-Augmented Generation for accurate, contextual responses</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Secure & Private</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Your conversations are secure and confidential</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Natural Conversation</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Chat naturally like you would with a human agent</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What I Can Help With
              </h3>
              <div className="space-y-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">💳 Payments & Billing</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Payment methods, schedules, issues</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">🏦 Loans & Applications</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Application process, requirements, rates</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">👤 Account Management</p>
                  <p className="text-xs text-purple-700 dark:text-purple-400">Account access, updates, security</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-300">❓ General Support</p>
                  <p className="text-xs text-orange-700 dark:text-orange-400">Policies, procedures, FAQ</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Try These Questions</h3>
              <div className="space-y-2 text-sm">
                <p className="opacity-90">"How do I make a payment?"</p>
                <p className="opacity-90">"What documents do I need for a loan?"</p>
                <p className="opacity-90">"How can I check my account balance?"</p>
                <p className="opacity-90">"What are your interest rates?"</p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatBot 
              className="h-[700px]"
              showMetadata={false}
              initialMessage="👋 Hello! I'm your Aven AI support assistant. I have access to comprehensive information about Aven's financial services including loans, payments, account management, and more.

How can I help you today? Feel free to ask me anything about:
• Payment options and schedules
• Loan applications and requirements  
• Account access and management
• Interest rates and fees
• General policies and procedures

Just type your question below and I'll provide you with accurate, helpful information!"
            />
          </div>
        </div>

        {/* Footer Information */}
        <div className="mt-12 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                How It Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">1. Ask Your Question</h4>
                  <p className="text-gray-600 dark:text-gray-300">Type your question naturally in the chat interface</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">2. AI Searches Knowledge</h4>
                  <p className="text-gray-600 dark:text-gray-300">Our AI finds the most relevant information from Aven's support docs</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">3. Get Smart Answer</h4>
                  <p className="text-gray-600 dark:text-gray-300">Receive a comprehensive, contextual response tailored to your needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 text-center">
          <details className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              🔧 Technical Information
            </summary>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p><strong>AI Model:</strong> OpenAI GPT-4o-mini for response generation</p>
              <p><strong>Vector Database:</strong> Pinecone with integrated embeddings</p>
              <p><strong>Search Technology:</strong> Semantic search using Llama-2 text embeddings</p>
              <p><strong>Data Source:</strong> Scraped and processed Aven support documentation</p>
              <p><strong>RAG Pipeline:</strong> Retrieval-Augmented Generation for contextually accurate responses</p>
              <p><strong>Security:</strong> No conversation data is stored permanently</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
