/**
 * SSE 工具函数（服务端 & 客户端共享）
 *
 * 职责：
 * 1. 按 \n\n 切分完整 SSE 事件行
 * 2. 从 "data: ..." 行中提取原始 JSON 字符串
 */

/**
 * 将 SSE 缓冲区按 \n\n 切分为完整事件行
 *
 * @param buffer - 当前累积的原始文本
 * @returns lines    - 已完整的事件行列表（每项是单行 "data: ..." 字符串）
 *          remaining - 尚未构成完整事件的剩余文本
 */
export function splitSSEBuffer(buffer: string): {
  lines: string[]
  remaining: string
} {
  const parts = buffer.split('\n\n')
  // 最后一段可能不完整，保留在 remaining
  const remaining = parts.pop() ?? ''
  // 每个完整事件块可能包含多行，取其中以 "data: " 开头的行
  const lines: string[] = []
  for (const part of parts) {
    for (const line of part.split('\n')) {
      if (line.startsWith('data: ')) {
        lines.push(line)
      }
    }
  }
  return { lines, remaining }
}

/**
 * 从 "data: ..." 格式的 SSE 行中提取原始数据字符串
 *
 * @param line - 形如 "data: {...}" 的 SSE 行
 * @returns 去掉前缀后的原始内容；若格式不匹配则返回 null
 */
export function parseSSELine(line: string): string | null {
  if (!line.startsWith('data: ')) return null
  return line.slice(6).trim()
}
