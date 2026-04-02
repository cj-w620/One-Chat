/**
 * AI 对话服务
 */

import { Message } from '@/types/chat'
import { siliconflowClient } from '@/server/clients/siliconflowClient'
import { saveMessage } from './conversationService'

class ChatService {
  private defaultModel = 'Qwen/Qwen2.5-7B-Instruct'

  /**
   * 处理流式对话请求
   * @param messages - 消息历史
   * @param conversationId - 会话 ID（用于保存消息）
   * @param model - 模型名称
   * @returns 流式响应
   */
  async streamChat(params: {
    messages: Message[]
    conversationId?: string
    model?: string
  }): Promise<ReadableStream> {
    const model = params.model || this.defaultModel
    const { conversationId } = params

    // 调用硅基流动流式 API
    const stream = await siliconflowClient.chatStream({
      model,
      messages: params.messages,
    })

    // 创建转换流，收集完整响应并保存到数据库
    let fullResponse = ''
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // 解析 SSE 数据
        const text = new TextDecoder().decode(chunk)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              const content = json.choices?.[0]?.delta?.content
              if (content) {
                fullResponse += content
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }

        // 直接传递原始数据块
        controller.enqueue(chunk)
      },
      async flush() {
        // 流结束时保存消息到数据库
        if (conversationId && fullResponse) {
          try {
            await saveMessage(conversationId, 'assistant', fullResponse)
          } catch (error) {
            console.error('保存消息失败:', error)
          }
        }
      },
    })

    return stream.pipeThrough(transformStream)
  }

  /**
   * 处理对话请求（非流式）
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
