/**
 * 聊天 Hook（支持 Function Calling）
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
      toolCalls: null,
      toolCallId: null,
      name: null,
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
      toolCalls: null,
      toolCallId: null,
      name: null,
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
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // 保留最后一个不完整的行
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) {
            continue
          }

          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            continue
          }

          try {
            const event = JSON.parse(data)

            // 处理新的 SSE 事件格式
            if (event.type === 'answer' && event.content) {
              accumulatedContent += event.content

              // 更新最后一条消息
              setMessages((prev) => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = accumulatedContent
                }
                return newMessages
              })
            } else if (event.type === 'thinking' && event.content) {
              // 可以选择显示思考内容
              console.log('AI thinking:', event.content)
            } else if (event.type === 'tool_call') {
              console.log('Tool call:', event.name, event)
            } else if (event.type === 'tool_result') {
              console.log('Tool result:', event.name, event)

              // 如果是图片生成，显示图片
              if (event.name === 'generate_image' && event.localUrl) {
                const imageMessage: Message = {
                  id: (Date.now() + 2).toString(),
                  conversationId: currentId,
                  role: 'assistant',
                  content: event.prompt || '生成的图片',
                  type: 'image',
                  imageUrl: event.localUrl,
                  toolCalls: null,
                  toolCallId: null,
                  name: null,
                  createdAt: new Date(),
                }
                setMessages((prev) => [...prev, imageMessage])
              }
            } else if (event.type === 'complete') {
              console.log('Stream complete')
            } else {
              // 兼容旧格式
              const content = event.choices?.[0]?.delta?.content
              if (content) {
                accumulatedContent += content

                setMessages((prev) => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = accumulatedContent
                  }
                  return newMessages
                })
              }
            }
          } catch (e) {
            // 忽略解析错误
            console.warn('Failed to parse SSE data:', data, e)
          }
        }
      }

      // 流结束后，不重新加载消息，保留前端累积的内容
      // 注释掉这行以避免覆盖前端显示的消息
      // await loadMessages(currentId)
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
