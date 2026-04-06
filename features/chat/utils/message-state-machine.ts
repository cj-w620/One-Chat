/**
 * 消息阶段状态机
 *
 * 职责：
 * 1. 管理单条 assistant 消息的生命周期阶段
 * 2. 根据事件类型执行状态转换
 * 3. 维护工具调用列表（添加、进度更新、完成）
 *
 * 状态转换图：
 *   idle ──START_THINKING──▶ thinking
 *        ──START_ANSWERING──▶ answering ──COMPLETE──▶ idle
 *        ──START_TOOL_CALL──▶ tool_calling ──TOOL_COMPLETE──▶ answering
 *   任意状态 ──ERROR──▶ error
 */

import type {
  MessagePhase,
  MessageEvent,
  MessageRuntimeState,
  ToolInvocation,
} from '../types/chat'

/**
 * 生成消息的初始运行时状态
 */
export function createInitialState(): MessageRuntimeState {
  return {
    phase: 'idle',
    thinkingContent: '',
    answerContent: '',
    toolInvocations: [],
    displayState: 'waiting',
  }
}

/**
 * 纯函数状态转换器
 *
 * 根据事件返回新状态，不修改原状态（不可变更新）。
 *
 * @param state - 当前状态
 * @param event - 触发的事件
 * @returns 更新后的新状态
 */
export function transition(
  state: MessageRuntimeState,
  event: MessageEvent
): MessageRuntimeState {
  switch (event.type) {
    case 'START_THINKING':
      return { ...state, phase: 'thinking', displayState: 'streaming' }

    case 'START_ANSWERING':
      return { ...state, phase: 'answering', displayState: 'streaming' }

    case 'START_TOOL_CALL': {
      const newInvocation: ToolInvocation = {
        toolCallId: event.toolCallId,
        name: event.name,
        state: 'running',
        args: event.args,
      }
      return {
        ...state,
        phase: 'tool_calling',
        displayState: 'streaming',
        toolInvocations: [...state.toolInvocations, newInvocation],
      }
    }

    case 'TOOL_PROGRESS': {
      const invocations = state.toolInvocations.map((inv) =>
        inv.toolCallId === event.toolCallId
          ? { ...inv, progress: event.progress, estimatedTime: event.estimatedTime }
          : inv
      )
      return { ...state, toolInvocations: invocations }
    }

    case 'TOOL_COMPLETE': {
      const invocations = state.toolInvocations.map((inv) =>
        inv.toolCallId === event.toolCallId
          ? {
              ...inv,
              state: event.success ? ('success' as const) : ('error' as const),
              result: event.result,
            }
          : inv
      )
      // 工具完成后切换回 answering 阶段
      return { ...state, phase: 'answering', toolInvocations: invocations }
    }

    case 'COMPLETE':
      return { ...state, phase: 'idle', displayState: 'idle' }

    case 'ERROR':
      return {
        ...state,
        phase: 'error',
        displayState: 'error',
        errorMessage: event.message,
      }

    default:
      return state
  }
}

/**
 * 追加思考内容
 */
export function appendThinking(
  state: MessageRuntimeState,
  content: string
): MessageRuntimeState {
  return { ...state, thinkingContent: state.thinkingContent + content }
}

/**
 * 追加回答内容
 */
export function appendAnswer(
  state: MessageRuntimeState,
  content: string
): MessageRuntimeState {
  return { ...state, answerContent: state.answerContent + content }
}
