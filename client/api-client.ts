import { ChatParams, ChatResponse } from '@/types/chat'

class ApiClient {
  private baseUrl = '/api'

  /**
   * 发送对话请求
   * @param params 对话参数
   * @returns 对话响应
   */
  async fetchChat(params: ChatParams): Promise<ChatResponse> {
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

    return response.json()
  }
}

export const apiClient = new ApiClient()
