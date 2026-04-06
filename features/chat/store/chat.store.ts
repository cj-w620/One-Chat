/**
 * Chat Store - 流式对话状态管理
 *
 * 职责：
 * 1. 维护当前会话的消息列表及按会话 ID 缓存
 * 2. 追踪流式状态（正在流式的消息 ID、当前阶段）
 * 3. 为每条 assistant 消息维护独立的运行时状态（通过状态机驱动）
 * 4. 暴露原子操作，供 ChatService 在流式过程中更新 UI
 */

'use client'

import { create } from 'zustand'
import type { ChatMessage, MessageEvent, MessageRuntimeState } from '../types/chat'
import {
  createInitialState,
  transition,
  appendThinking,
  appendAnswer,
} from '../utils/message-state-machine'

interface ChatStore {
  // ── 消息列表 ────────────────────────────────────────────────────────────────
  messages: ChatMessage[]
  /** 按会话 ID 缓存的历史消息，切换会话时避免重复请求 */
  messageCache: Map<string, ChatMessage[]>

  // ── 流式状态 ────────────────────────────────────────────────────────────────
  /** 当前正在流式接收内容的消息 ID */
  streamingMessageId: string | null
  /** 当前流式阶段（thinking / answer），用于 UI 展示 */
  streamingPhase: 'thinking' | 'answer' | null
  /** 是否正在发送消息（防止重复提交） */
  isSendingMessage: boolean

  // ── 每条消息的运行时状态 ────────────────────────────────────────────────────
  messageStates: Map<string, MessageRuntimeState>

  // ── 操作 ─────────────────────────────────────────────────────────────────────
  /** 追加一条消息 */
  addMessage: (message: ChatMessage) => void
  /** 用历史消息替换当前列表（切换会话时使用） */
  setMessages: (conversationId: string, messages: ChatMessage[]) => void
  /** 清空当前消息列表 */
  clearMessages: () => void

  /** 初始化某条消息的运行时状态 */
  initMessageState: (messageId: string) => void
  /** 对某条消息的状态机派发事件 */
  transitionPhase: (messageId: string, event: MessageEvent) => void
  /** 追加 thinking 内容 */
  appendThinkingContent: (messageId: string, content: string) => void
  /** 追加 answer 内容（同时更新 messages 列表中的 content） */
  appendAnswerContent: (messageId: string, content: string) => void

  /** 标记开始流式接收 */
  startStreaming: (messageId: string, phase: 'thinking' | 'answer') => void
  /** 标记流式接收结束 */
  stopStreaming: () => void

  /** 设置 isSendingMessage */
  setSendingMessage: (sending: boolean) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  messageCache: new Map(),
  streamingMessageId: null,
  streamingPhase: null,
  isSendingMessage: false,
  messageStates: new Map(),

  // ── 消息列表操作 ─────────────────────────────────────────────────────────────

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }))
  },

  setMessages: (conversationId, messages) => {
    const cache = new Map(get().messageCache)
    cache.set(conversationId, messages)
    set({ messages, messageCache: cache })
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  // ── 消息状态机操作 ───────────────────────────────────────────────────────────

  initMessageState: (messageId) => {
    const states = new Map(get().messageStates)
    states.set(messageId, createInitialState())
    set({ messageStates: states })
  },

  transitionPhase: (messageId, event) => {
    const states = new Map(get().messageStates)
    const current = states.get(messageId) ?? createInitialState()
    states.set(messageId, transition(current, event))

    // 同步 displayState 到 messages 列表
    const newState = states.get(messageId)!
    const messages = get().messages.map((msg) =>
      msg.id === messageId
        ? { ...msg, runtimeState: newState }
        : msg
    )

    set({ messageStates: states, messages })
  },

  appendThinkingContent: (messageId, content) => {
    const states = new Map(get().messageStates)
    const current = states.get(messageId) ?? createInitialState()
    states.set(messageId, appendThinking(current, content))
    set({ messageStates: states })
  },

  appendAnswerContent: (messageId, content) => {
    const states = new Map(get().messageStates)
    const current = states.get(messageId) ?? createInitialState()
    const newState = appendAnswer(current, content)
    states.set(messageId, newState)

    // 同步 content 字段到 messages 列表，使组件能直接读取
    const messages = get().messages.map((msg) =>
      msg.id === messageId
        ? { ...msg, content: newState.answerContent, runtimeState: newState }
        : msg
    )

    set({ messageStates: states, messages })
  },

  // ── 流式状态操作 ─────────────────────────────────────────────────────────────

  startStreaming: (messageId, phase) => {
    set({ streamingMessageId: messageId, streamingPhase: phase })
  },

  stopStreaming: () => {
    set({ streamingMessageId: null, streamingPhase: null })
  },

  setSendingMessage: (sending) => {
    set({ isSendingMessage: sending })
  },
}))
