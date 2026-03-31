'use client'

import { useState } from 'react'
import { Message } from '@/types/chat'
import { apiClient } from '@/client/api-client'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async (content: string) => {
    setIsLoading(true)
    setError(null)

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    }

    // 添加用户消息到列表
    setMessages((prev) => [...prev, userMessage])

    try {
      // 调用 API
      const response = await apiClient.fetchChat({
        messages: [...messages, userMessage],
      })

      // 添加 AI 回复到列表
      setMessages((prev) => [...prev, response.message])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送失败'
      setError(errorMessage)
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  }
}
