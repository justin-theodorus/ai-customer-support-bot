'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from './ui/avatar'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

export function ChatMessage({ role, content, timestamp, isTyping = false }: ChatMessageProps) {
  const isUser = role === 'user'
  
  if (isTyping) {
    return (
      <div className="flex gap-4 justify-start">
        <Avatar className="w-10 h-10 border-2 border-muted">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
            A
          </AvatarFallback>
        </Avatar>
        <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3 min-w-16">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          </div>
          <div className="text-xs text-muted-foreground/70 mt-2">
            AI is typing...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="w-10 h-10 border-2 border-muted">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
            A
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-muted/50 text-foreground border border-border/50'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        <div className="text-xs opacity-60 mt-2">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-10 h-10 border-2 border-muted">
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
} 