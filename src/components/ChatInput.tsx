'use client'

import { Send } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface ChatInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as React.FormEvent<HTMLFormElement>)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex w-full items-end gap-3"
    >
      <Textarea
        placeholder="Ask me anything about Aven..."
        className="min-h-16 flex-1 resize-none rounded-lg border bg-muted/50 px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus:bg-background"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={1}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
        disabled={isLoading || !value.trim()}
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send Message</span>
      </Button>
    </form>
  )
} 