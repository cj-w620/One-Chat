import { NextRequest, NextResponse } from 'next/server'
import { chatService } from '@/server/services/chatService'

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

    // 调用服务层获取流式响应
    const stream = await chatService.streamChat({
      messages,
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
