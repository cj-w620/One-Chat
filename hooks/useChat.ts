/**
 * 聊天 Hook
 */

'use client'

import { useState, useEffect } from 'react'
import { Message } from '@/types/chat'
import { apiClient } from '@/client/api-client'
import { useConversationStore } from '@/store/conversationStore'

export function useChat() {
  const { currentId, messages: storeMessages, loadMessages } =
    useConversationStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 当切换会话时，加载历史消息
  useEffect(() => {
    if (currentId) {
      loadMessages(currentId)
    }
  }, [currentId, loadMessages])

  // 同步 store 中的消息到本地状态
  useEffect(() => {
    setMessages(storeMessages)
  }, [storeMessages])

  const sendMessage = async (content: string) => {
    if (!currentId) {
      setError('请先创建或选择一个会话')
      return
    }

    setIsLoading(true)
    setError(null)

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId: currentId,
      role: 'user',
      content,
      type: 'text',
      imageUrl: null,
      createdAt: new Date(),
    }

    // 添加用户消息到列表
    setMessages((prev) => [...prev, userMessage])

    // 创建空的 AI 消息（用于流式更新）
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      conversationId: currentId,
      role: 'assistant',
      content: '',
      type: 'text',
      imageUrl: null,
      createdAt: new Date(),
    }

    // 添加空的 AI 消息
    setMessages((prev) => [...prev, aiMessage])

    try {
      // 调用 API 获取流式响应
      const response = await apiClient.fetchChat({
        messages: [...messages, userMessage],
        conversationId: currentId,
      })

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // 读取流式数据
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // 解码数据块
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content

              if (content) {
                accumulatedContent += content

                // 只更新最后一条消息
                setMessages((prev) => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = accumulatedContent
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // 忽略解析错误
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }

      // 流结束后，重新加载消息以获取数据库中的完整数据
      await loadMessages(currentId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送失败'
      setError(errorMessage)
      console.error('Chat error:', err)

      // 移除失败的 AI 消息
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId))
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
