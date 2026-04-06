export type SSEEventType =
  | 'thinking'
  | 'answer'
  | 'tool_call'
  | 'tool_progress'
  | 'tool_result'
  | 'complete'

export interface SSEEvent {
  type: SSEEventType
  sessionId?: string
  conversationId?: string
  [key: string]: unknown
}

export class SSEWriter {
  private encoder = new TextEncoder()
  private controller: ReadableStreamDefaultController<Uint8Array>
  private closed = false

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller
  }

  async writeEvent(event: SSEEvent): Promise<void> {
    if (this.closed) return

    try {
      const data = JSON.stringify(event)
      const message = `data: ${data}\n\n`
      this.controller.enqueue(this.encoder.encode(message))
    } catch (error) {
      console.error('Failed to write SSE event:', error)
    }
  }

  async writeThinking(content: string, sessionId?: string): Promise<void> {
    await this.writeEvent({
      type: 'thinking',
      content,
      sessionId,
    })
  }

  async writeAnswer(content: string, sessionId?: string): Promise<void> {
    await this.writeEvent({
      type: 'answer',
      content,
      sessionId,
    })
  }

  async writeToolCall(
    toolCallId: string,
    name: string,
    args: Record<string, unknown>,
    sessionId?: string
  ): Promise<void> {
    await this.writeEvent({
      type: 'tool_call',
      toolCallId,
      name,
      ...args,
      sessionId,
    })
  }

  async writeToolProgress(
    toolCallId: string,
    progress: number,
    sessionId?: string
  ): Promise<void> {
    await this.writeEvent({
      type: 'tool_progress',
      toolCallId,
      progress,
      sessionId,
    })
  }

  async writeToolResult(
    toolCallId: string,
    name: string,
    success: boolean,
    data: Record<string, unknown>,
    sessionId?: string
  ): Promise<void> {
    await this.writeEvent({
      type: 'tool_result',
      toolCallId,
      name,
      success,
      ...data,
      sessionId,
    })
  }

  async writeComplete(sessionId?: string): Promise<void> {
    await this.writeEvent({
      type: 'complete',
      sessionId,
    })
  }

  async close(): Promise<void> {
    if (this.closed) return

    try {
      this.closed = true
      this.controller.close()
    } catch (error) {
      // Controller might already be closed
      console.error('Failed to close SSE writer:', error)
    }
  }
}
