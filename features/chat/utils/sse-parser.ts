/**
 * SSE 消息解析器（客户端）
 *
 * 职责：
 * 1. 消费 fetch response body reader
 * 2. 按 \n\n 切分完整 SSE 事件行
 * 3. 将每行解析为标准 SSEData 对象
 * 4. 通过回调通知调用方
 */

import { splitSSEBuffer, parseSSELine } from '@/lib/utils/sse'
import type { SSEData } from '../types/chat'

/** parseStream 的回调集合 */
export interface SSECallbacks {
  /** 每收到一条完整 SSE 数据时触发 */
  onData: (data: SSEData) => void
  /** 流正常结束时触发（reader.done = true 之后） */
  onComplete?: () => void
  /** 流读取过程中发生错误时触发 */
  onError?: (error: unknown) => void
}

export class SSEParser {
  /**
   * 消费 ReadableStreamDefaultReader，将 SSE 事件流逐条解析并回调
   *
   * @param reader    - fetch response.body.getReader() 返回的 reader
   * @param callbacks - 事件回调
   */
  static async parseStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    callbacks: SSECallbacks
  ): Promise<void> {
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // 处理 buffer 中可能残留的内容
          const { lines } = splitSSEBuffer(buffer + '\n\n')
          for (const line of lines) {
            const parsed = SSEParser.parseLine(line)
            if (parsed) callbacks.onData(parsed)
          }
          callbacks.onComplete?.()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const { lines, remaining } = splitSSEBuffer(buffer)
        buffer = remaining

        for (const line of lines) {
          const parsed = SSEParser.parseLine(line)
          if (parsed) callbacks.onData(parsed)
        }
      }
    } catch (error) {
      callbacks.onError?.(error)
    }
  }

  /**
   * 将单条 "data: ..." 行解析为 SSEData
   *
   * @returns 解析结果，若行格式不合法则返回 null
   */
  static parseLine(line: string): SSEData | null {
    const raw = parseSSELine(line)
    if (raw === null) return null

    // [DONE] 标志流结束
    if (raw === '[DONE]') return { type: 'complete' }

    try {
      return JSON.parse(raw) as SSEData
    } catch {
      return null
    }
  }
}
