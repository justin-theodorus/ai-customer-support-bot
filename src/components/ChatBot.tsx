'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { Send, Bot, User, Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    responseTime?: number;
    tokensUsed?: number;
    contextUsed?: boolean;
    searchResults?: {
      count: number;
      processingTime: number;
      topScore: number;
    };
  };
}

interface ChatBotProps {
  className?: string;
  initialMessage?: string;
  showMetadata?: boolean;
}

export function ChatBot({ className, initialMessage, showMetadata = false }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (!isInitialized) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: initialMessage || "Hello! I'm your Aven customer support assistant. How can I help you today? You can ask me about payments, loans, account management, or any other questions about Aven's services.",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setIsInitialized(true);
    }
  }, [initialMessage, isInitialized]);

  // Send message to chat API
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare conversation history (exclude metadata for API)
      const conversation = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          conversation,
          includeContext: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success toast with metadata if enabled
      if (showMetadata && data.metadata) {
        toast({
          title: 'Response Generated',
          description: `${data.metadata.responseTime}ms • ${data.metadata.tokensUsed} tokens • Context: ${data.metadata.contextUsed ? 'Yes' : 'No'}`,
          variant: 'default',
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact customer support if the issue persists.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setIsInitialized(false);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={cn('flex flex-col h-[600px] max-w-4xl mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-xl text-gray-900 dark:text-white">Aven Support Assistant</CardTitle>
        </div>
        <div className="flex space-x-2">
          {showMetadata && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/chat', '_blank')}
              className="text-xs"
            >
              API Info
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={clearConversation}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 space-y-4 overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation...</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[70%] p-3 rounded-lg space-y-1',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  )}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>{formatTime(message.timestamp)}</span>
                    
                    {showMetadata && message.metadata && (
                      <span className="ml-2">
                        {message.metadata.responseTime}ms
                        {message.metadata.contextUsed && ' • RAG'}
                      </span>
                    )}
                  </div>

                  {/* Detailed metadata for development */}
                  {showMetadata && message.metadata && message.metadata.searchResults && (
                    <div className="text-xs opacity-60 pt-1 border-t border-current/20">
                      Context: {message.metadata.searchResults.count} results, 
                      top score: {message.metadata.searchResults.topScore.toFixed(3)}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about Aven's services..."
            disabled={isLoading}
            className="flex-1 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            maxLength={500}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Character count */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {inputValue.length}/500
        </div>
      </CardContent>
    </Card>
  );
} 