/**
 * 会话列表 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  getConversations,
  createConversation,
} from '@/server/services/conversationService'

/**
 * GET /api/conversations
 * 获取当前用户的会话列表
 * @security 从 session 获取 userId，只返回当前用户的会话
 */
export async function GET() {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 获取会话列表
    const conversations = await getConversations(session.user.id)

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    return NextResponse.json(
      { error: '获取会话列表失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations
 * 创建新会话
 * @security 从 session 获取 userId，关联到当前用户
 */
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 解析请求体
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }

    // 创建会话
    const conversation = await createConversation(session.user.id, title)

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('创建会话失败:', error)
    return NextResponse.json({ error: '创建会话失败' }, { status: 500 })
  }
}