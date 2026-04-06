/**
 * Chat API Route - /api/chat
 *
 * 职责：
 * 1. 鉴权（NextAuth session）
 * 2. 参数校验
 * 3. 调用 handleChatRequest 获取 SSE 流
 * 4. 返回带元数据响应头的 SSE Response
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { handleChatRequest } from '@/server/services/chat/chat.service'

export async function POST(req: NextRequest) {
  // 1. 鉴权
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 2. 解析并校验参数
  let body: {
    content?: string
    conversationId?: string
    model?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体解析失败' }, { status: 400 })
  }

  const { content, conversationId, model } = body

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return NextResponse.json({ error: 'content 不能为空' }, { status: 400 })
  }
  if (!conversationId || typeof conversationId !== 'string') {
    return NextResponse.json({ error: 'conversationId 不能为空' }, { status: 400 })
  }

  // 3. 获取 API Key（用户自有 Key 优先，否则使用环境变量）
  const apiKey =
    (session.user as { apiKey?: string }).apiKey ||
    process.env.SILICONFLOW_API_KEY ||
    ''
  if (!apiKey) {
    return NextResponse.json({ error: 'AI API Key 未配置' }, { status: 500 })
  }

  try {
    // 4. 调用核心业务层
    const { stream, sessionId, conversationTitle } = await handleChatRequest({
      userId: session.user.id,
      apiKey,
      conversationId,
      userContent: content.trim(),
      model,
    })

    // 5. 返回 SSE 流，在响应头中携带会话元数据
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Session-ID': sessionId,
        'X-Conversation-ID': conversationId,
        'X-Conversation-Title': encodeURIComponent(conversationTitle),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'

    // 权限/不存在类错误返回 4xx
    if (message === '会话不存在') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    if (message === '无权限访问此会话') {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    console.error('[Chat Route] error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
