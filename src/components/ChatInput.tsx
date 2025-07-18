'use client'

import { Send, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as React.FormEvent<HTMLFormElement>)
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative flex items-center gap-3">
      <div className="flex-1 relative">
        <Input
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "AI is responding..." : "Ask me anything about Aven..."}
          className={`w-full h-12 bg-muted/50 border-border/50 text-foreground placeholder-muted-foreground rounded-xl px-4 py-4 pr-14 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-base ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={!value.trim() || isLoading}
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:opacity-50 rounded-lg p-2.5 transition-all"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0ms]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:200ms]" />
              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:400ms]" />
            </div>
            <span className="text-xs text-muted-foreground/70">Processing...</span>
          </div>
        )}
      </div>
    </form>
  )
} 