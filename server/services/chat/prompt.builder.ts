/**
 * Prompt Builder - 上下文消息构建器
 *
 * 职责：
 * 1. 拼装系统 prompt
 * 2. 将历史消息格式化为 API 可接受的结构
 * 3. 追加当前用户消息，组成完整上下文
 */

import type { Message } from '@prisma/client'
import type { ToolCall } from '@/types/chat'

/** 发送给 AI 的单条消息格式 */
export interface ApiMessage {
  role: string
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

/** 系统 prompt 文本 */
const SYSTEM_PROMPT =
  '你是一个有用的 AI 助手。' +
  '当需要最新信息时使用 web_search 工具，' +
  '当需要生成图片时使用 generate_image 工具。' +
  '重要：不要在回复中输出 <tool_call> 或其他 XML 标签，直接使用工具调用功能。'

/**
 * 将 Prisma Message 转为 API 消息格式
 */
function toApiMessage(msg: Message): ApiMessage {
  const m: ApiMessage = {
    role: msg.role,
    content: msg.content || null,
  }
  if (msg.toolCalls) m.tool_calls = msg.toolCalls as unknown as ToolCall[]
  if (msg.toolCallId) m.tool_call_id = msg.toolCallId
  if (msg.name) m.name = msg.name
  return m
}

/**
 * 构建完整的上下文消息列表
 *
 * 将系统 prompt + 历史消息 + 当前用户消息合并为发送给 AI 的消息序列。
 *
 * @param history        - 当前会话的历史消息（按时间升序）
 * @param userContent    - 本次用户输入的文本
 * @returns 可直接传给 createChatCompletion 的消息数组
 */
export function buildContextMessages(
  history: Message[],
  userContent: string
): ApiMessage[] {
  const systemMessage: ApiMessage = {
    role: 'system',
    content: SYSTEM_PROMPT,
  }

  // 过滤掉 system 角色（由本函数统一注入），避免重复
  const historyMessages = history
    .filter((m) => m.role !== 'system')
    .map(toApiMessage)

  const userMessage: ApiMessage = {
    role: 'user',
    content: userContent,
  }

  return [systemMessage, ...historyMessages, userMessage]
}
