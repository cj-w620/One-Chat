'use client'

import { Message } from '@/types/chat'
import { ChatMessage } from './ChatMessage'
import { useEffect, useRef } from 'react'

interface ChatListProps {
  messages: Message[]
}

export function ChatList({ messages }: ChatListProps) {
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
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
