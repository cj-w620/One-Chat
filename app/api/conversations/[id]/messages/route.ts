/**
 * 会话消息 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getMessages } from '@/server/services/conversationService'

/**
 * GET /api/conversations/[id]/messages
 * 获取会话的所有消息
 * @security 验证会话所有权，防止访问他人会话
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { id } = await params

    // 获取消息（会验证所有权）
    const messages = await getMessages(id, session.user.id)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('获取消息失败:', error)

    if (error instanceof Error) {
      if (error.message === '会话不存在') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message === '无权限访问此会话') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ error: '获取消息失败' }, { status: 500 })
  }
}