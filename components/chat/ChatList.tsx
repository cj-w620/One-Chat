/**
 * ChatList - 聊天消息列表组件
 *
 * 渲染当前会话的所有消息，新消息到来时自动滚动到底部。
 */

'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/features/chat/types/chat'

interface ChatListProps {
  messages: ChatMessageType[]
  /** 是否有消息正在流式接收，用于显示流式光标 */
  streamingMessageId?: string | null
}

export function ChatList({ messages, streamingMessageId }: ChatListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // 新消息到来时自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>发送消息开始对话</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
