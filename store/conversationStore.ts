/**
 * 会话状态管理
 */

import { create } from 'zustand'
import { Conversation, Message } from '@/types/chat'
import { apiClient } from '@/client/api-client'

interface ConversationStore {
  // 状态
  conversations: Conversation[]
  currentId: string | null
  messages: Message[]
  loading: boolean
  error: string | null

  // 操作
  fetchConversations: () => Promise<void>
  createConversation: (title: string) => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>
  setCurrentId: (id: string | null) => void
  loadMessages: (conversationId: string) => Promise<void>
  addMessage: (message: Message) => void
  clearMessages: () => void
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  // 初始状态
  conversations: [],
  currentId: null,
  messages: [],
  loading: false,
  error: null,

  // 获取会话列表
  fetchConversations: async () => {
    try {
      set({ loading: true, error: null })
      const conversations = await apiClient.fetchConversations()
      set({ conversations, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取会话列表失败',
        loading: false,
      })
    }
  },

  // 创建新会话
  createConversation: async (title: string) => {
    try {
      set({ loading: true, error: null })
      const conversation = await apiClient.createConversation(title)
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentId: conversation.id,
        messages: [],
        loading: false,
      }))
      return conversation
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建会话失败',
        loading: false,
      })
      throw error
    }
  },

  // 删除会话
  deleteConversation: async (id: string) => {
    try {
      set({ loading: true, error: null })
      await apiClient.deleteConversation(id)
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentId: state.currentId === id ? null : state.currentId,
        messages: state.currentId === id ? [] : state.messages,
        loading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除会话失败',
        loading: false,
      })
      throw error
    }
  },

  // 设置当前会话 ID
  setCurrentId: (id: string | null) => {
    set({ currentId: id, messages: [] })
  },

  // 加载会话消息
  loadMessages: async (conversationId: string) => {
    try {
      set({ loading: true, error: null })
      const messages = await apiClient.fetchMessages(conversationId)
      set({ messages, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载消息失败',
        loading: false,
      })
    }
  },

  // 添加消息到当前会话
  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  // 清空消息
  clearMessages: () => {
    set({ messages: [] })
  },
}))