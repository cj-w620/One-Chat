/**
 * 会话业务逻辑
 */

import { prisma } from '@/lib/prisma'
import type { Conversation, Message } from '@prisma/client'

/**
 * 获取用户的所有会话
 * @param userId - 用户 ID
 * @returns 会话列表（按更新时间倒序）
 * @security 只返回当前用户的会话
 */
export async function getConversations(
  userId: string
): Promise<Conversation[]> {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
}

/**
 * 创建新会话
 * @param userId - 用户 ID
 * @param title - 会话标题
 * @returns 创建的会话对象
 */
export async function createConversation(
  userId: string,
  title: string
): Promise<Conversation> {
  return prisma.conversation.create({
    data: {
      userId,
      title,
    },
  })
}

/**
 * 删除会话
 * @param id - 会话 ID
 * @param userId - 用户 ID
 * @throws {Error} 会话不存在或无权限时抛出错误
 * @security 验证会话所有权，防止删除他人会话
 */
export async function deleteConversation(
  id: string,
  userId: string
): Promise<void> {
  // 验证会话所有权
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  })

  if (!conversation) {
    throw new Error('会话不存在')
  }

  if (conversation.userId !== userId) {
    throw new Error('无权限删除此会话')
  }

  // 删除会话（级联删除消息）
  await prisma.conversation.delete({
    where: { id },
  })
}

/**
 * 获取会话的所有消息
 * @param conversationId - 会话 ID
 * @param userId - 用户 ID
 * @returns 消息列表（按创建时间升序）
 * @throws {Error} 会话不存在或无权限时抛出错误
 * @security 验证会话所有权，防止访问他人会话
 */
export async function getMessages(
  conversationId: string,
  userId: string
): Promise<Message[]> {
  // 验证会话所有权
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation) {
    throw new Error('会话不存在')
  }

  if (conversation.userId !== userId) {
    throw new Error('无权限访问此会话')
  }

  // 获取消息
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * 保存消息到数据库
 * @param conversationId - 会话 ID
 * @param role - 消息角色（user/assistant/tool）
 * @param content - 消息内容
 * @param options - 可选参数（工具调用相关）
 * @returns 创建的消息对象
 */
export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  options?: {
    toolCalls?: any
    toolCallId?: string
    name?: string
    type?: string
    imageUrl?: string
  }
): Promise<Message> {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      type: options?.type || 'text',
      imageUrl: options?.imageUrl || null,
      toolCalls: options?.toolCalls || null,
      toolCallId: options?.toolCallId || null,
      name: options?.name || null,
    },
  })
}