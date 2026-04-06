/**
 * SSE Writer - 服务端事件写入器
 *
 * 职责：
 * 1. 封装 ReadableStreamDefaultController，提供语义化发送方法
 * 2. 将结构化数据序列化为标准 SSE 格式："data: {...}\n\n"
 * 3. 处理流关闭和错误
 */

export type SSEEventType =
  | 'thinking'
  | 'answer'
  | 'tool_call'
  | 'tool_progress'
  | 'tool_result'
  | 'complete'

/** 所有 SSE 事件的基础结构 */
export interface SSEData {
  type: SSEEventType
  content?: string
  sessionId?: string
  toolCallId?: string
  name?: string
  query?: string
  prompt?: string
  progress?: number
  estimatedTime?: number
  success?: boolean
  imageUrl?: string
  localUrl?: string
  width?: number
  height?: number
  resultCount?: number
  sources?: Array<{ url: string; title?: string }>
  [key: string]: unknown
}

export class SSEWriter {
  private readonly encoder = new TextEncoder()
  private closed = false

  constructor(
    private readonly controller: ReadableStreamDefaultController<Uint8Array>
  ) {}

  // ─── 私有核心方法 ────────────────────────────────────────────────────────────

  private send(data: Record<string, unknown>): void {
    if (this.closed) return
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      this.controller.enqueue(this.encoder.encode(message))
    } catch {
      // controller 可能已关闭，忽略写入错误
    }
  }

  // ─── 语义化发送方法 ──────────────────────────────────────────────────────────

  /** 发送 AI 思考过程片段 */
  sendThinking(content: string): void {
    this.send({ type: 'thinking', content })
  }

  /** 发送 AI 回答文本片段 */
  sendAnswer(content: string): void {
    this.send({ type: 'answer', content })
  }

  /** 发送工具调用开始事件 */
  sendToolCall(
    toolCallId: string,
    name: string,
    args: Record<string, unknown>
  ): void {
    this.send({ type: 'tool_call', toolCallId, name, ...args })
  }

  /** 发送工具执行进度（0~1） */
  sendToolProgress(
    toolCallId: string,
    progress: number,
    estimatedTime?: number
  ): void {
    this.send({ type: 'tool_progress', toolCallId, progress, estimatedTime })
  }

  /** 发送工具执行结果 */
  sendToolResult(
    toolCallId: string,
    name: string,
    success: boolean,
    data: Record<string, unknown>
  ): void {
    this.send({ type: 'tool_result', toolCallId, name, success, ...data })
  }

  /** 发送流结束事件，并追加 [DONE] 标记 */
  sendComplete(): void {
    this.send({ type: 'complete' })
    if (!this.closed) {
      try {
        this.controller.enqueue(this.encoder.encode('data: [DONE]\n\n'))
      } catch {
        // 忽略
      }
    }
  }

  /** 关闭流 controller */
  close(): void {
    if (this.closed) return
    this.closed = true
    try {
      this.controller.close()
    } catch {
      // controller 可能已被关闭
    }
  }

  /** 以错误关闭流 */
  error(err: unknown): void {
    if (this.closed) return
    this.closed = true
    try {
      this.controller.error(err)
    } catch {
      // 忽略
    }
  }
}
