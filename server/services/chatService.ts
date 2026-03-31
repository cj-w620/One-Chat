import { Message } from '@/types/chat'
import { siliconflowClient } from '@/server/clients/siliconflowClient'

class ChatService {
  private defaultModel = 'Qwen/Qwen2.5-7B-Instruct'

  /**
   * 处理对话请求
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
