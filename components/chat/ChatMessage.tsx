/**
 * ChatMessage - 单条消息渲染组件
 *
 * 支持 text（含流式光标）和 image（点击放大）两种类型。
 */

'use client'

import { cn } from '@/lib/utils'
import { StreamingText } from './StreamingText'
import ImageMessage from './ImageMessage'
import type { ChatMessage as ChatMessageType } from '@/features/chat/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
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
        {message.type === 'image' && message.imageUrl ? (
          <ImageMessage imageUrl={message.imageUrl} prompt={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words break-all">
            {isUser ? (
              message.content
            ) : (
              <StreamingText content={message.content} isStreaming={isStreaming} />
            )}
          </p>
        )}
      </div>
    </div>
  )
}
