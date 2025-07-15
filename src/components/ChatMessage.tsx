'use client'

import { cn } from '@/lib/utils'
import { User } from 'lucide-react'
import Image from 'next/image'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
          <Image
            src="/aven_logo.svg"
            alt="Aven AI"
            width={24}
            height={9}
            className="brightness-0 dark:invert"
          />
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-4',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground mt-1">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  )
} 