/**
 * 聊天相关类型定义
 */

import type { Conversation as PrismaConversation, Message as PrismaMessage } from '@prisma/client'

// 消息类型（与 Prisma 模型一致）
export type Message = PrismaMessage

// 会话类型（与 Prisma 模型一致）
export type Conversation = PrismaConversation

// 对话请求参数
export interface ChatParams {
  messages: Message[]
  conversationId?: string
  model?: string
}

// 对话响应
export interface ChatResponse {
  message: Message
}
