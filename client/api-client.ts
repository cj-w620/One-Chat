/**
 * API 客户端
 */

import { ChatParams, Conversation, Message } from '@/types/chat'

class ApiClient {
  private baseUrl = '/api'

  /**
   * 发送对话请求（流式）
   */
  async fetchChat(params: ChatParams): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API Error: ${response.statusText}`)
    }

    return response
  }

  /**
   * 获取会话列表
   */
  async fetchConversations(): Promise<Conversation[]> {
    const response = await fetch(`${this.baseUrl}/conversations`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || '获取会话列表失败')
    }

    const data = await response.json()
    return data.conversations
  }

  /**
   * 创建新会话
   */
  async createConversation(title: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || '创建会话失败')
    }

    const data = await response.json()
    return data.conversation
  }

  /**
   * 删除会话
   */
  async deleteConversation(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || '删除会话失败')
    }
  }

  /**
   * 获取会话消息
   */
  async fetchMessages(conversationId: string): Promise<Message[]> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/messages`
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || '获取消息失败')
    }

    const data = await response.json()
    return data.messages
  }
}

export const apiClient = new ApiClient()
