/**
 * AI 对话 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { chatService } from '@/server/services/chatService'
import { saveMessage } from '@/server/services/conversationService'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析请求参数
    const body = await req.json()
    const { messages, model, conversationId } = body

    // 参数验证
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // 如果提供了 conversationId，验证所有权
    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      })

      if (!conversation) {
        return NextResponse.json(
          { error: '会话不存在' },
          { status: 404 }
        )
      }

      if (conversation.userId !== session.user.id) {
        return NextResponse.json(
          { error: '无权限访问此会话' },
          { status: 403 }
        )
      }

      // 保存用户消息到数据库
      const userMessage = messages[messages.length - 1]
      if (userMessage.role === 'user') {
        await saveMessage(conversationId, 'user', userMessage.content)
      }
    }

    // 调用服务层获取流式响应
    const stream = await chatService.streamChat({
      messages,
      conversationId,
      model,
    })

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
