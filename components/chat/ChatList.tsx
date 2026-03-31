'use client'

import { Message } from '@/types/chat'
import { ChatMessage } from './ChatMessage'
import { useEffect, useRef } from 'react'

interface ChatListProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatList({ messages, isLoading = false }: ChatListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>发送消息开始对话</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((message, index) => {
        // 判断是否是最后一条 AI 消息且正在加载
        const isLastMessage = index === messages.length - 1
        const isStreaming = isLastMessage && message.role === 'assistant' && isLoading

        return (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming}
          />
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
