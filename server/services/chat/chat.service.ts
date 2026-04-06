/**
 * Chat Service - 核心业务编排
 *
 * 职责：
 * 1. 验证会话所有权
 * 2. 保存用户消息、预创建空 assistant 消息
 * 3. 构建上下文消息（系统 prompt + 历史 + 当前输入）
 * 4. 调用 SiliconFlow API 获取流
 * 5. 根据是否有工具，选择对应的流处理器
 * 6. 返回 SSE ReadableStream 和会话元数据
 *
 * 不依赖 Next.js，纯业务逻辑，可在任意 Node.js 环境复用。
 */

import { prisma } from '@/lib/prisma'
import { ensureToolsReady, getToolRegistry } from '@/server/tools'
import { createChatCompletion } from '../ai/siliconflow'
import { buildContextMessages } from './prompt.builder'
import { createSSEStream, createSSEStreamWithTools } from './stream.handler'
import { createEmptyAssistantMessage, saveUserMessage } from './message-persister'

/** handleChatRequest 的入参 */
export interface ChatRequestParams {
  /** 当前用户 ID */
  userId: string
  /** 用于调用 AI API 的 Key */
  apiKey: string
  /** 目标会话 ID（必须属于 userId） */
  conversationId: string
  /** 用户本次输入的文本 */
  userContent: string
  /** 可选的模型名称，默认使用环境变量或内置默认值 */
  model?: string
}

/** handleChatRequest 的返回值 */
export interface ChatRequestResult {
  /** 封装好的 SSE ReadableStream，直接作为 Response body */
  stream: ReadableStream
  /** 会话 ID（与入参相同，方便 route 层透传给响应头） */
  sessionId: string
  /** 会话 ID */
  conversationId: string
  /** 会话标题（用于首条消息时更新 UI） */
  conversationTitle: string
}

const DEFAULT_MODEL = 'Qwen/Qwen2.5-7B-Instruct'

/**
 * 处理一次完整的聊天请求
 *
 * @throws 会话不存在或用户无权限时抛出错误
 */
export async function handleChatRequest(
  params: ChatRequestParams
): Promise<ChatRequestResult> {
  const {
    userId,
    apiKey,
    conversationId,
    userContent,
    model = DEFAULT_MODEL,
  } = params

  // 1. 验证会话所有权
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  if (!conversation) throw new Error('会话不存在')
  if (conversation.userId !== userId) throw new Error('无权限访问此会话')

  // 2. 确保工具注册表就绪
  await ensureToolsReady()
  const toolRegistry = getToolRegistry()
  const toolDefinitions = toolRegistry.getToolDefinitions()

  // 3. 获取历史消息，构建上下文
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })

  // 4. 保存用户消息，预创建空 assistant 消息
  await saveUserMessage(conversationId, userContent)
  const messageId = await createEmptyAssistantMessage(conversationId)

  // 5. 构建发送给 AI 的消息序列（system + history + 本次用户输入）
  const contextMessages = buildContextMessages(history, userContent)

  // 6. 调用 AI，获取原始流 reader
  const { reader } = await createChatCompletion(apiKey, {
    model,
    messages: contextMessages,
    tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
  })

  // 7. 选择流处理器
  const streamContext = {
    model,
    messages: contextMessages,
    apiKey,
    messageId,
    conversationId,
  }

  const stream =
    toolDefinitions.length > 0
      ? createSSEStreamWithTools(reader, streamContext)
      : createSSEStream(reader, streamContext)

  return {
    stream,
    sessionId: conversationId,
    conversationId,
    conversationTitle: conversation.title,
  }
}
