/**
 * 单个会话 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { deleteConversation } from '@/server/services/conversationService'

/**
 * DELETE /api/conversations/[id]
 * 删除会话
 * @security 验证会话所有权，防止删除他人会话
 */
export async function DELETE(
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

    // 删除会话（会验证所有权）
    await deleteConversation(id, session.user.id)

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除会话失败:', error)

    if (error instanceof Error) {
      if (error.message === '会话不存在') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message === '无权限删除此会话') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return NextResponse.json({ error: '删除会话失败' }, { status: 500 })
  }
}