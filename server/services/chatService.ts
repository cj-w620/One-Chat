import { Message } from '@/types/chat'
import { siliconflowClient } from '@/server/clients/siliconflowClient'

class ChatService {
  private defaultModel = 'Qwen/Qwen2.5-7B-Instruct'

  /**
   * 处理流式对话请求
   */
  async streamChat(params: {
    messages: Message[]
    model?: string
  }): Promise<ReadableStream> {
    const model = params.model || this.defaultModel

    // 调用硅基流动流式 API
    const stream = await siliconflowClient.chatStream({
      model,
      messages: params.messages,
    })

    // 创建转换流，处理 SSE 格式
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // 直接传递原始数据块
        controller.enqueue(chunk)
      },
    })

    return stream.pipeThrough(transformStream)
  }

  /**
   * 处理对话请求（非流式，保留用于兼容）
   */
  async chat(params: {
    messages: Message[]
    model?: string
  }): Promise<{ content: string }> {
    const model = params.model || this.defaultModel

    // 调用硅基流动 API
    const response = await siliconflowClient.chat({
      model,
      messages: params.messages,
    })

    return response
  }
}

export const chatService = new ChatService()
