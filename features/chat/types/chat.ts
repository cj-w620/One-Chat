/**
 * Chat 模块核心类型定义（客户端）
 *
 * 职责：
 * 1. 定义 SSE 事件数据结构
 * 2. 定义消息状态机的状态与事件
 * 3. 定义 UI 展示所需的消息运行时状态
 */

// ─── SSE 事件类型 ─────────────────────────────────────────────────────────────

export type SSEEventType =
  | 'thinking'
  | 'answer'
  | 'tool_call'
  | 'tool_progress'
  | 'tool_result'
  | 'complete'

/** 搜索来源条目 */
export interface SearchSource {
  url: string
  title?: string
}

/** 服务端推送的标准 SSE 数据包 */
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
  sources?: SearchSource[]
  [key: string]: unknown
}

// ─── 消息展示状态 ─────────────────────────────────────────────────────────────

/** assistant 消息的展示阶段 */
export type MessageDisplayState =
  | 'waiting'      // 已创建，等待 AI 开始响应
  | 'streaming'    // 正在接收流式内容
  | 'idle'         // 完成
  | 'error'        // 出错（可重试）
  | 'regenerating' // 重新生成中

// ─── 工具调用状态 ─────────────────────────────────────────────────────────────

/** 单次工具调用的运行时状态 */
export interface ToolInvocation {
  toolCallId: string
  name: string
  /** running → success | error */
  state: 'running' | 'success' | 'error'
  args?: Record<string, unknown>
  result?: unknown
  progress?: number
  estimatedTime?: number
}

// ─── 消息状态机 ───────────────────────────────────────────────────────────────

/** 消息内容接收阶段 */
export type MessagePhase =
  | 'idle'
  | 'thinking'
  | 'answering'
  | 'tool_calling'
  | 'error'

/** 状态机事件 */
export type MessageEvent =
  | { type: 'START_THINKING' }
  | { type: 'START_ANSWERING' }
  | { type: 'START_TOOL_CALL'; toolCallId: string; name: string; args?: Record<string, unknown> }
  | { type: 'TOOL_PROGRESS'; toolCallId: string; progress: number; estimatedTime?: number }
  | { type: 'TOOL_COMPLETE'; toolCallId: string; success: boolean; result?: unknown }
  | { type: 'COMPLETE' }
  | { type: 'ERROR'; message: string }

/** 每条 assistant 消息的运行时状态 */
export interface MessageRuntimeState {
  phase: MessagePhase
  thinkingContent: string
  answerContent: string
  toolInvocations: ToolInvocation[]
  displayState: MessageDisplayState
  errorMessage?: string
}

// ─── 客户端消息（用于 UI 渲染） ───────────────────────────────────────────────

/** 前端展示用的消息对象 */
export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  /** 消息类型：text（默认）| image（图片生成结果） */
  type?: 'text' | 'image'
  /** 图片 URL（仅 type === 'image' 时使用） */
  imageUrl?: string
  /** 运行时状态（仅 assistant 消息使用） */
  runtimeState?: MessageRuntimeState
  createdAt: Date
}
