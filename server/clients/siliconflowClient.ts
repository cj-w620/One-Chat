import { Message, Tool, ToolCall } from '@/types/chat'

interface ChatCompletionParams {
  model: string
  messages: Array<{
    role: string
    content: string | null
    tool_calls?: ToolCall[]
    tool_call_id?: string
    name?: string
  }>
  tools?: Tool[]
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

interface SearchResponse {
  results: Array<{
    title: string
    url: string
    snippet: string
  }>
}

interface ImageGenerationResponse {
  images: Array<{
    url: string
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
   * 调用对话 API（流式，支持工具调用）
   */
  async chatStream(params: {
    model: string
    messages: Message[]
    tools?: Tool[]
  }): Promise<ReadableStream> {
    const requestBody: ChatCompletionParams = {
      model: params.model,
      messages: params.messages.map((msg) => {
        const message: any = {
          role: msg.role,
          content: msg.content || null,
        }

        // 添加工具调用相关字段
        if (msg.toolCalls) {
          message.tool_calls = msg.toolCalls
        }
        if (msg.toolCallId) {
          message.tool_call_id = msg.toolCallId
        }
        if (msg.name) {
          message.name = msg.name
        }

        return message
      }),
      stream: true,
    }

    // 添加工具定义
    if (params.tools && params.tools.length > 0) {
      requestBody.tools = params.tools
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

    if (!response.body) {
      throw new Error('Response body is null')
    }

    return response.body
  }

  /**
   * 调用对话 API（非流式，保留用于兼容）
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

  /**
   * 联网搜索
   */
  async search(query: string): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SiliconFlow Search API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * 图片生成
   */
  async generateImage(params: {
    prompt: string
    model?: string
    size?: string
  }): Promise<ImageGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model || 'stabilityai/stable-diffusion-3-5-large',
        image_size: params.size || '1024x1024',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SiliconFlow Image API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }
}

export const siliconflowClient = new SiliconFlowClient()
