/**
 * AI 对话服务（支持 Function Calling）
 */

import { Message } from '@/types/chat'
import { siliconflowClient } from '@/server/clients/siliconflowClient'
import { ensureToolsReady, getToolRegistry } from '@/server/tools'
import { createSSEStreamWithTools } from './stream-handler'

class ChatService {
  private defaultModel = 'Qwen/Qwen2.5-7B-Instruct'

  /**
   * 处理流式对话请求（支持工具调用）
   */
  async streamChat(params: {
    messages: Message[]
    conversationId?: string
    model?: string
  }): Promise<ReadableStream> {
    const model = params.model || this.defaultModel
    const { conversationId, messages } = params

    await ensureToolsReady()

    const toolRegistry = getToolRegistry()
    const toolDefinitions = toolRegistry.getToolDefinitions()

    console.log(`Available tools: ${toolDefinitions.length}`)

    // 添加系统提示（如果第一条消息不是 system）
    let messagesWithSystem = [...messages]
    if (messages.length === 0 || messages[0].role !== 'system') {
      const systemMessage: Message = {
        id: 'system',
        conversationId: conversationId || '',
        role: 'system',
        content: '你是一个有用的 AI 助手。当需要最新信息时使用 web_search 工具，当需要生成图片时使用 generate_image 工具。重要：不要在回复中输出 <tool_call> 或其他 XML 标签，直接使用工具调用功能。',
        type: 'text',
        imageUrl: null,
        toolCalls: null,
        toolCallId: null,
        name: null,
        createdAt: new Date(),
      }
      messagesWithSystem = [systemMessage, ...messages]
    }

    const stream = await siliconflowClient.chatStream({
      model,
      messages: messagesWithSystem,
      tools: toolDefinitions,
    })

    const reader = stream.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    return createSSEStreamWithTools(reader, {
      model,
      messages: messagesWithSystem,
      conversationId,
    })
  }

  /**
   * 处理对话请求（非流式）
   */
  async chat(params: {
    messages: Message[]
    model?: string
  }): Promise<{ content: string }> {
    const model = params.model || this.defaultModel

    const response = await siliconflowClient.chat({
      model,
      messages: params.messages,
    })

    return response
  }
}

export const chatService = new ChatService()
