import { ChatInterface } from '@/components/ChatInterface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aven AI Chat',
  description: 'Chat with the Aven AI support assistant.',
}

export default function ChatPage() {
  return <ChatInterface />
}
