/**
 * useChat Hook
 *
 * 职责：
 * 1. 从 useChatStore 读取当前会话的消息列表和流式状态
 * 2. 代理 chatService 的 sendMessage / abortStream，供 UI 组件调用
 * 3. 监听会话切换，加载历史消息
 */

'use client'

import { useEffect } from 'react'
import { useConversationStore } from '@/store/conversationStore'
import { useChatStore } from '@/features/chat/store/chat.store'
import { chatService } from '@/features/chat/services/chat.service'
import { apiClient } from '@/client/api-client'
import type { ChatMessage } from '@/features/chat/types/chat'
import type { Message } from '@/types/chat'

/** 将 Prisma Message 转换为前端 ChatMessage */
function toChatMessage(msg: Message): ChatMessage {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    role: msg.role as ChatMessage['role'],
    content: msg.content,
    createdAt: msg.createdAt,
  }
}

export function useChat() {
  const { currentId } = useConversationStore()
  const {
    messages,
    isSendingMessage,
    streamingMessageId,
    setMessages,
    clearMessages,
  } = useChatStore()

  // ── 监听会话切换，加载历史消息 ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentId) {
      clearMessages()
      return
    }

    apiClient
      .fetchMessages(currentId)
      .then((msgs) => setMessages(currentId, msgs.map(toChatMessage)))
      .catch(console.error)
  }, [currentId, setMessages, clearMessages])

  // ── 监听会话标题更新事件（由 ChatService 触发） ──────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { conversationId, title } = (e as CustomEvent).detail
      const { conversations } = useConversationStore.getState()
      const target = conversations.find((c) => c.id === conversationId)
      if (target && target.title !== title) {
        useConversationStore.setState((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, title } : c
          ),
        }))
      }
    }
    window.addEventListener('chat:title-updated', handler)
    return () => window.removeEventListener('chat:title-updated', handler)
  }, [])

  // ── 对外 API ─────────────────────────────────────────────────────────────────

  const sendMessage = async (content: string, options?: { model?: string }) => {
    if (!currentId) return
    await chatService.sendMessage(currentId, content, options)
  }

  const abortStream = () => {
    chatService.abortStream()
  }

  return {
    messages,
    isLoading: isSendingMessage,
    streamingMessageId,
    sendMessage,
    abortStream,
  }
}
