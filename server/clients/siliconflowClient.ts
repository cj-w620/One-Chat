import { Message } from '@/types/chat'

interface ChatCompletionParams {
  model: string
  messages: Array<{
    role: string
    content: string
  }>
  stream?: boolean
}

interface ChatCompletionResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
}

class SiliconFlowClient {
  private apiKey: string
  private baseUrl = 'https://api.siliconflow.cn/v1'

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('SILICONFLOW_API_KEY is not configured')
    }
  }

  /**
   * 调用对话 API
   */
  async chat(params: {
    model: string
    messages: Message[]
  }): Promise<{ content: string }> {
    const requestBody: ChatCompletionParams = {
      model: params.model,
      messages: params.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: false,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SiliconFlow API Error: ${response.status} - ${error}`)
    }

    const data: ChatCompletionResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI')
    }

    return {
      content: data.choices[0].message.content,
    }
  }
}

export const siliconflowClient = new SiliconFlowClient()
