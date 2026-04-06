/**
 * StreamBuffer - rAF 批量渲染缓冲器
 *
 * 职责：
 * 1. 缓存高频 SSE chunk（80-120 个/s），避免每个 chunk 都触发 setState
 * 2. 使用 requestAnimationFrame 将更新频率上限控制在 60fps
 * 3. 提供 forceFlush 方法，在流结束时立即刷新（不等下一帧）
 */

export interface StreamBufferOptions {
  /** 每帧刷新时的回调，接收本帧累积的所有内容 */
  onFlush: (content: string) => void
}

export class StreamBuffer {
  private buffer = ''
  private rafId: number | null = null
  private readonly onFlush: (content: string) => void

  constructor(options: StreamBufferOptions) {
    this.onFlush = options.onFlush
  }

  /**
   * 追加新内容到缓冲区
   *
   * 若当前帧尚未安排刷新，则调度下一帧执行；否则仅累积内容。
   */
  append(chunk: string): void {
    this.buffer += chunk
    if (this.rafId !== null) return // 已有待处理帧，不重复调度
    this.rafId = requestAnimationFrame(() => {
      this.flush()
    })
  }

  /**
   * 立即刷新缓冲区内容（取消未执行的 rAF）
   *
   * 在流结束（complete / error）时调用，确保最后一批内容不丢失。
   */
  forceFlush(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.flush()
  }

  /**
   * 销毁缓冲区，取消未执行的 rAF 并清空内容
   *
   * 在 React 组件 unmount 或流生命周期结束时调用，防止内存泄漏。
   */
  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.buffer = ''
  }

  // ─── 私有 ────────────────────────────────────────────────────────────────────

  private flush(): void {
    if (!this.buffer) return
    const content = this.buffer
    this.buffer = ''
    this.rafId = null
    this.onFlush(content)
  }
}
