'use client'

import { Message } from '@/types/chat'
import { cn } from '@/lib/utils'
import { StreamingText } from './StreamingText'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {isUser ? (
            message.content
          ) : (
            <StreamingText content={message.content} isStreaming={isStreaming} />
          )}
        </p>
      </div>
    </div>
  )
}
