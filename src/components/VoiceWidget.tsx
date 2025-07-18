'use client'

import React, { useState, useEffect } from 'react'
import Vapi from '@vapi-ai/web'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, PhoneOff } from 'lucide-react'
import { cn } from '@/lib/utils'
// Client-side environment variables
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID

interface VoiceMessage {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

interface VoiceWidgetProps {
  className?: string
}

export function VoiceWidget({ className }: VoiceWidgetProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState<VoiceMessage[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Check if required environment variables are available
    if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
      console.warn('VAPI environment variables not configured. VoiceWidget will not be functional.')
      return
    }
    if (!isInitialized && VAPI_PUBLIC_KEY) {
      const vapiInstance = new Vapi(VAPI_PUBLIC_KEY)
      setVapi(vapiInstance)

      // Event listeners
      vapiInstance.on('call-start', () => {
        console.log('Call started')
        setIsConnected(true)
        setIsListening(true)
      })

      vapiInstance.on('call-end', () => {
        console.log('Call ended')
        setIsConnected(false)
        setIsSpeaking(false)
        setIsListening(false)
      })

      vapiInstance.on('speech-start', () => {
        console.log('Assistant started speaking')
        setIsSpeaking(true)
        setIsListening(false)
      })

      vapiInstance.on('speech-end', () => {
        console.log('Assistant stopped speaking')
        setIsSpeaking(false)
        setIsListening(true)
      })

      vapiInstance.on('message', (message) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setTranscript(prev => [...prev, {
            role: message.role,
            text: message.transcript,
            timestamp: new Date()
          }])
        }
      })

      vapiInstance.on('error', (error) => {
        console.error('Vapi error:', error)
      })

      setIsInitialized(true)

      return () => {
        vapiInstance?.stop()
      }
    }
  }, [isInitialized])

  const startCall = () => {
    if (vapi && VAPI_ASSISTANT_ID) {
      vapi.start(VAPI_ASSISTANT_ID)
    }
  }

  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Check if required environment variables are available
  if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
    return null
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {!isConnected ? (
        <Button
          onClick={startCall}
          size="lg"
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <Mic className="h-6 w-6 text-white" />
          <span className="sr-only">Start voice chat</span>
        </Button>
      ) : (
        <Card className="w-80 bg-white dark:bg-gray-900 shadow-xl border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-3 h-3 rounded-full transition-colors',
                  isSpeaking ? 'bg-red-500 animate-pulse' : 
                  isListening ? 'bg-green-500' : 'bg-gray-400'
                )} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {isSpeaking ? 'Assistant Speaking...' : 
                   isListening ? 'Listening...' : 'Connected'}
                </span>
              </div>
              <Button
                onClick={endCall}
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="sr-only">End call</span>
              </Button>
            </div>
            
            {/* Transcript */}
            <div className="max-h-64 overflow-y-auto mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {transcript.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Voice conversation will appear here...
                </p>
              ) : (
                <div className="space-y-3">
                  {transcript.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] px-3 py-2 rounded-lg text-sm',
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        )}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {isSpeaking && (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                  <span>AI is speaking</span>
                </div>
              )}
              {isListening && !isSpeaking && (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  <span>Listening for your voice</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 