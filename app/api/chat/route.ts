import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/server/services/chatService'
import { Message } from '@/types/chat'

export async function POST(req: NextRequest) {
  try {
    // 解析请求参数
    const body = await req.json()
    const { messages, model } = body

    // 参数验证
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // 调用服务层
    const response = await chatService.chat({
      messages,
      model,
    })

    // 创建 AI 消息
    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.content,
      createdAt: new Date(),
    }

    // 返回响应
    return NextResponse.json({
      message: aiMessage,
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
