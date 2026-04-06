/**
 * Chat Service - 客户端业务逻辑
 *
 * 职责：
 * 1. 发起 /api/chat 请求，携带 AbortController 支持中断
 * 2. 将流式 SSE 事件分发到 StreamBuffer → Zustand Store
 * 3. 处理工具进度、工具结果等 UI 状态更新
 * 4. 提供 abortStream 方法，供用户主动停止生成
 *
 * 不依赖 React，纯业务逻辑，可在 Hook 或测试中调用。
 */

import { SSEParser } from '../utils/sse-parser'
import { StreamBuffer } from '../utils/stream-buffer'
import { useChatStore } from '../store/chat.store'
import type { ChatMessage, SSEData } from '../types/chat'

class ChatService {
  /** 当前流式请求的 AbortController，null 表示无活跃请求 */
  private abortController: AbortController | null = null

  /**
   * 发送消息并处理流式响应
   *
   * @param conversationId - 当前会话 ID
   * @param content        - 用户输入文本
   * @param options        - 可选参数（model 等）
   */
  async sendMessage(
    conversationId: string,
    content: string,
    options?: { model?: string }
  ): Promise<void> {
    const store = useChatStore.getState()

    // 防止重复提交
    if (store.isSendingMessage) return
    store.setSendingMessage(true)

    // 1. 立即在 UI 中添加用户消息
    const userMessageId = `user-${Date.now()}`
    const userMessage: ChatMessage = {
      id: userMessageId,
      conversationId,
      role: 'user',
      content,
      createdAt: new Date(),
    }
    store.addMessage(userMessage)

    // 2. 添加 AI 占位消息（displayState: 'waiting'）
    const aiMessageId = `ai-${Date.now() + 1}`
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      conversationId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }
    store.addMessage(aiMessage)
    store.initMessageState(aiMessageId)

    // 3. 发起 fetch 请求（携带 AbortController）
    this.abortController = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          conversationId,
          model: options?.model,
        }),
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: '请求失败' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      // 4. 从响应头同步会话标题（首条消息时服务端会设置）
      const newTitle = response.headers.get('X-Conversation-Title')
      if (newTitle) {
        // 触发会话列表更新，此处通过自定义事件通知 ConversationStore
        window.dispatchEvent(
          new CustomEvent('chat:title-updated', {
            detail: { conversationId, title: decodeURIComponent(newTitle) },
          })
        )
      }

      if (!response.body) throw new Error('Response body is null')

      // 5. 进入流处理
      const reader = response.body.getReader()
      await this.handleStream(reader, aiMessageId)
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // 用户主动中断，标记消息完成
        store.transitionPhase(aiMessageId, { type: 'COMPLETE' })
      } else {
        const message = error instanceof Error ? error.message : '发送失败'
        store.transitionPhase(aiMessageId, { type: 'ERROR', message })
      }
    } finally {
      this.abortController = null
      store.stopStreaming()
      store.setSendingMessage(false)
    }
  }

  /**
   * 处理 SSE 流，将事件分发到 Store
   */
  private async handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    messageId: string
  ): Promise<void> {
    const store = useChatStore.getState()

    // 创建两个独立的 StreamBuffer（thinking 和 answer 分别缓冲）
    const thinkingBuffer = new StreamBuffer({
      onFlush: (content) => {
        store.appendThinkingContent(messageId, content)
      },
    })
    const answerBuffer = new StreamBuffer({
      onFlush: (content) => {
        store.appendAnswerContent(messageId, content)
      },
    })

    await SSEParser.parseStream(reader, {
      onData: (data: SSEData) => {
        this.handleSSEData(data, messageId, thinkingBuffer, answerBuffer)
      },
      onError: (error) => {
        thinkingBuffer.forceFlush()
        answerBuffer.forceFlush()
        const message = error instanceof Error ? error.message : '流处理错误'
        store.transitionPhase(messageId, { type: 'ERROR', message })
      },
      onComplete: () => {
        thinkingBuffer.forceFlush()
        answerBuffer.forceFlush()
        store.stopStreaming()
      },
    })

    thinkingBuffer.destroy()
    answerBuffer.destroy()
  }

  /**
   * 根据 SSE 事件类型更新 Store 状态
   */
  private handleSSEData(
    data: SSEData,
    messageId: string,
    thinkingBuffer: StreamBuffer,
    answerBuffer: StreamBuffer
  ): void {
    const store = useChatStore.getState()

    switch (data.type) {
      case 'thinking':
        store.startStreaming(messageId, 'thinking')
        store.transitionPhase(messageId, { type: 'START_THINKING' })
        if (data.content) thinkingBuffer.append(data.content)
        break

      case 'answer':
        store.startStreaming(messageId, 'answer')
        store.transitionPhase(messageId, { type: 'START_ANSWERING' })
        if (data.content) answerBuffer.append(data.content)
        break

      case 'tool_call':
        if (data.toolCallId && data.name) {
          store.transitionPhase(messageId, {
            type: 'START_TOOL_CALL',
            toolCallId: data.toolCallId,
            name: data.name,
          })
        }
        break

      case 'tool_progress':
        if (data.toolCallId) {
          store.transitionPhase(messageId, {
            type: 'TOOL_PROGRESS',
            toolCallId: data.toolCallId,
            progress: data.progress ?? 0,
            estimatedTime: data.estimatedTime,
          })
        }
        break

      case 'tool_result':
        if (data.toolCallId) {
          store.transitionPhase(messageId, {
            type: 'TOOL_COMPLETE',
            toolCallId: data.toolCallId,
            success: data.success ?? false,
            result: data,
          })
        }

        // 图片生成完成：添加独立的图片消息到 store
        if (data.name === 'generate_image' && data.success && data.localUrl) {
          const currentState = useChatStore.getState()
          const convId =
            currentState.messages.find((m) => m.id === messageId)
              ?.conversationId ?? ''
          const imageMessage: ChatMessage = {
            id: `img-${Date.now()}`,
            conversationId: convId,
            role: 'assistant',
            content: (data.prompt as string) ?? '生成的图片',
            type: 'image',
            imageUrl: data.localUrl as string,
            createdAt: new Date(),
          }
          useChatStore.getState().addMessage(imageMessage)
        }
        break

      case 'complete':
        thinkingBuffer.forceFlush()
        answerBuffer.forceFlush()
        store.transitionPhase(messageId, { type: 'COMPLETE' })
        store.stopStreaming()
        break
    }
  }

  /**
   * 中止当前流式请求
   */
  abortStream(): void {
    this.abortController?.abort()
  }
}

/** 全局单例，跨组件共享 */
export const chatService = new ChatService()
