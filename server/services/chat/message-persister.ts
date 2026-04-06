/**
 * 消息持久化
 *
 * 职责：
 * 1. 在流开始前预创建空 assistant 消息（保证中断时记录仍存在）
 * 2. 在流结束后更新消息内容（answer / thinking / tool 数据）
 * 3. 更新会话的 updatedAt 时间戳
 */

import { prisma } from '@/lib/prisma'
import type { Message } from '@prisma/client'

/** persistMessage 的写入参数 */
export interface PersistParams {
  /** AI 回答正文 */
  answerContent: string
  /** AI 思考内容（CoT），当前 schema 暂无该字段，预留 */
  thinkingContent?: string
  /** 工具调用列表（JSON 可序列化） */
  toolCallsData?: unknown[] | null
  /** 工具结果列表（JSON 可序列化） */
  toolResultsData?: unknown[] | null
}

/**
 * 在流开始前预创建空的 assistant 消息
 *
 * 流处理中即使连接中断，消息记录也已存在于数据库。
 *
 * @param conversationId - 所属会话 ID
 * @returns 预创建消息的 id
 */
export async function createEmptyAssistantMessage(
  conversationId: string
): Promise<string> {
  const message = await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: '',
      type: 'text',
    },
  })
  return message.id
}

/**
 * 流结束后将实际内容写入预创建的 assistant 消息
 *
 * @param messageId      - 预创建消息的 id
 * @param conversationId - 所属会话 ID（用于更新 updatedAt）
 * @param params         - 要写入的内容
 */
export async function persistMessage(
  messageId: string,
  conversationId: string,
  params: PersistParams
): Promise<Message> {
  const { answerContent, toolCallsData } = params

  // 使用事务同时更新消息内容和会话时间戳
  const [message] = await prisma.$transaction([
    prisma.message.update({
      where: { id: messageId },
      data: {
        content: answerContent,
        // toolCalls 字段已在 schema 中定义为 Json?
        toolCalls: toolCallsData ? (toolCallsData as object[]) : undefined,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ])

  return message
}

/**
 * 保存用户消息到数据库
 *
 * @param conversationId - 所属会话 ID
 * @param content        - 消息文本
 * @returns 创建的消息对象
 */
export async function saveUserMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  return prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content,
      type: 'text',
    },
  })
}
