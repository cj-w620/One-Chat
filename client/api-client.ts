import { ChatParams } from '@/types/chat'

class ApiClient {
  private baseUrl = '/api'

  /**
   * 发送对话请求（流式）
   * @param params 对话参数
   * @returns Response 对象（包含流式数据）
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
}

export const apiClient = new ApiClient()
