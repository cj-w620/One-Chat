/**
 * SSE 流处理器
 *
 * 职责：
 * 1. 消费 SiliconFlow 原始 SSE 流，解析 delta 片段
 * 2. 区分 thinking / answer / tool_calls 三种内容
 * 3. 向客户端转发标准化 SSE 事件
 * 4. 支持并行工具执行与多轮对话（最多 MAX_TOOL_ROUNDS 轮）
 * 5. 流结束后持久化最终消息
 */

import { SSEWriter } from './sse-writer'
import { persistMessage } from './message-persister'
import { createChatCompletion } from '../ai/siliconflow'
import { splitSSEBuffer, parseSSELine } from '@/lib/utils/sse'
import { executeToolCalls, formatToolMessages } from '@/server/tools/handler'
import { getToolRegistry } from '@/server/tools'
import type { ApiMessage } from './prompt.builder'

/** 工具调用内部状态（收集流式 arguments 分片） */
interface ToolCallChunk {
  id: string
  name: string
  arguments: string
}

/** createSSEStream / createSSEStreamWithTools 共享的上下文 */
export interface StreamContext {
  /** AI 模型名称 */
  model: string
  /** 完整上下文消息（含 system + history + user） */
  messages: ApiMessage[]
  /** 用于鉴权的 API Key */
  apiKey: string
  /** 预创建 assistant 消息的 id，用于流结束后持久化 */
  messageId: string
  /** 所属会话 id */
  conversationId: string
}

const MAX_TOOL_ROUNDS = 5

// ─── 工具：检查字符串是否为完整 JSON ────────────────────────────────────────

function isCompleteJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// ─── 无工具版流处理器 ─────────────────────────────────────────────────────────

/**
 * 处理无工具调用的纯文字流
 *
 * 将 reasoning_content（思考）和 content（回答）转发给客户端，
 * 流结束后持久化消息。
 */
export function createSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  context: StreamContext
): ReadableStream {
  const { messageId, conversationId } = context
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const writer = new SSEWriter(controller)
      let buffer = ''
      let thinkingContent = ''
      let answerContent = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            // 处理缓冲区剩余内容
            const { lines } = splitSSEBuffer(buffer + '\n\n')
            for (const line of lines) {
              processLine(line, writer, (t) => { thinkingContent += t }, (a) => { answerContent += a })
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const { lines, remaining } = splitSSEBuffer(buffer)
          buffer = remaining

          for (const line of lines) {
            processLine(line, writer, (t) => { thinkingContent += t }, (a) => { answerContent += a })
          }
        }

        await persistMessage(messageId, conversationId, {
          answerContent,
          thinkingContent,
          toolCallsData: null,
        })

        writer.sendComplete()
      } catch (err) {
        console.error('[SSEStream] error:', err)
        writer.error(err)
      } finally {
        writer.close()
      }
    },
  })
}

// ─── 带工具的流处理器 ─────────────────────────────────────────────────────────

/**
 * 处理带工具调用的流（支持多轮、并行执行）
 *
 * 核心策略：
 * - 一旦某个 tool_call 的 arguments 收集完整（完整 JSON），立即异步启动工具执行
 * - 所有轮次结束后，替换 AI 幻想的图片 URL 并持久化最终消息
 */
export function createSSEStreamWithTools(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  context: StreamContext
): ReadableStream {
  const { model, messages, apiKey, messageId, conversationId } = context
  const toolRegistry = getToolRegistry()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const writer = new SSEWriter(controller)

      let currentReader = reader
      let currentMessages: ApiMessage[] = [...messages]
      let round = 0

      // 跨轮次累积的最终内容
      let finalThinkingContent = ''
      let finalAnswerContent = ''
      const allToolCallsData: unknown[] = []

      try {
        while (round < MAX_TOOL_ROUNDS) {
          round++

          const {
            thinkingContent,
            answerContent,
            toolCallChunks,
            toolPromises,
          } = await processAIResponseWithParallelTools(
            currentReader,
            decoder,
            writer,
            apiKey
          )

          finalThinkingContent += thinkingContent
          finalAnswerContent += answerContent

          if (toolCallChunks.length === 0) {
            // 本轮无工具调用，流程结束
            break
          }

          // 等待所有并行工具完成
          const toolResults = await Promise.all(toolPromises)

          // 向客户端发送工具结果
          for (const result of toolResults) {
            const resultData = JSON.parse(result.content)
            writer.sendToolResult(
              result.toolCallId,
              result.name,
              result.success,
              resultData
            )
          }

          // 记录工具调用数据，用于持久化
          const toolCallsForMessages = toolCallChunks.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          }))
          allToolCallsData.push(...toolCallsForMessages)

          // 构建下一轮的消息（assistant + tool 结果）
          const assistantMsg: ApiMessage = {
            role: 'assistant',
            content: answerContent || null,
            tool_calls: toolCallsForMessages,
          }
          const toolMessages = formatToolMessages(toolResults).map((tm) => ({
            role: 'tool' as const,
            content: tm.content,
            tool_call_id: tm.tool_call_id,
          }))

          currentMessages = [...currentMessages, assistantMsg, ...toolMessages]

          // 发起下一轮 AI 请求
          const toolDefinitions = toolRegistry.getToolDefinitions()
          const { reader: nextReader } = await createChatCompletion(apiKey, {
            model,
            messages: currentMessages,
            tools: toolDefinitions,
          })
          currentReader = nextReader
        }

        await persistMessage(messageId, conversationId, {
          answerContent: finalAnswerContent,
          thinkingContent: finalThinkingContent,
          toolCallsData: allToolCallsData.length > 0 ? allToolCallsData : null,
        })

        writer.sendComplete()
      } catch (err) {
        console.error('[SSEStreamWithTools] error:', err)
        writer.error(err)
      } finally {
        writer.close()
      }
    },
  })
}

// ─── 内部辅助：处理单轮 AI 响应并并行启动工具 ────────────────────────────────

interface RoundResult {
  thinkingContent: string
  answerContent: string
  toolCallChunks: ToolCallChunk[]
  toolPromises: Promise<{ toolCallId: string; name: string; content: string; success: boolean }>[]
}

async function processAIResponseWithParallelTools(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  writer: SSEWriter,
  apiKey: string
): Promise<RoundResult> {
  const toolRegistry = getToolRegistry()
  let buffer = ''
  let thinkingContent = ''
  let answerContent = ''

  // index → ToolCallChunk
  const toolCallsMap = new Map<number, ToolCallChunk>()
  // 已启动工具的 chunk index 集合，避免重复启动
  const startedTools = new Set<number>()
  const toolPromises: RoundResult['toolPromises'] = []

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      // 刷新剩余 buffer
      const { lines } = splitSSEBuffer(buffer + '\n\n')
      for (const line of lines) {
        handleDelta(
          line,
          writer,
          toolCallsMap,
          startedTools,
          toolPromises,
          toolRegistry,
          (t) => { thinkingContent += t },
          (a) => { answerContent += a }
        )
      }
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const { lines, remaining } = splitSSEBuffer(buffer)
    buffer = remaining

    for (const line of lines) {
      handleDelta(
        line,
        writer,
        toolCallsMap,
        startedTools,
        toolPromises,
        toolRegistry,
        (t) => { thinkingContent += t },
        (a) => { answerContent += a }
      )
    }
  }

  return {
    thinkingContent,
    answerContent,
    toolCallChunks: Array.from(toolCallsMap.values()),
    toolPromises,
  }
}

// ─── 内部辅助：解析并处理单条 SSE delta ─────────────────────────────────────

function handleDelta(
  line: string,
  writer: SSEWriter,
  toolCallsMap: Map<number, ToolCallChunk>,
  startedTools: Set<number>,
  toolPromises: RoundResult['toolPromises'],
  toolRegistry: ReturnType<typeof getToolRegistry>,
  onThinking: (t: string) => void,
  onAnswer: (a: string) => void
): void {
  const raw = parseSSELine(line)
  if (!raw || raw === '[DONE]') return

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    return
  }

  const delta = parsed?.choices?.[0]?.delta
  if (!delta) return

  // ── thinking ──────────────────────────────────────────────────────────────
  if (delta.reasoning_content) {
    onThinking(delta.reasoning_content)
    writer.sendThinking(delta.reasoning_content)
  }

  // ── answer ────────────────────────────────────────────────────────────────
  if (delta.content) {
    // 过滤 XML 工具标签（部分模型会错误输出）
    let content: string = delta.content
    content = content.replace(/<\/?tool_call[^>]*>/g, '')
    content = content.replace(/<\/?function_calls[^>]*>/g, '')
    if (content) {
      onAnswer(content)
      writer.sendAnswer(content)
    }
  }

  // ── tool_calls ────────────────────────────────────────────────────────────
  if (delta.tool_calls) {
    for (const tc of delta.tool_calls as any[]) {
      const idx: number = tc.index ?? 0
      const id: string = tc.id ?? `call_${idx}`

      if (!toolCallsMap.has(idx)) {
        toolCallsMap.set(idx, { id, name: '', arguments: '' })
      }

      const chunk = toolCallsMap.get(idx)!
      if (tc.id) chunk.id = tc.id
      if (tc.function?.name) chunk.name = tc.function.name
      if (tc.function?.arguments) chunk.arguments += tc.function.arguments

      // 一旦 arguments 构成完整 JSON，立即通知客户端并启动工具
      if (!startedTools.has(idx) && chunk.name && isCompleteJSON(chunk.arguments)) {
        startedTools.add(idx)
        const args = JSON.parse(chunk.arguments) as Record<string, unknown>
        writer.sendToolCall(chunk.id, chunk.name, args)

        // 并行启动工具，不等待
        const promise = toolRegistry
          .executeByName(chunk.name, args)
          .then((content) => ({
            toolCallId: chunk.id,
            name: chunk.name,
            content,
            success: true,
          }))
          .catch((err: Error) => ({
            toolCallId: chunk.id,
            name: chunk.name,
            content: JSON.stringify({ error: err.message }),
            success: false,
          }))

        toolPromises.push(promise)
      }
    }
  }
}

// ─── 内部辅助：处理无工具的单行 delta ────────────────────────────────────────

function processLine(
  line: string,
  writer: SSEWriter,
  onThinking: (t: string) => void,
  onAnswer: (a: string) => void
): void {
  const raw = parseSSELine(line)
  if (!raw || raw === '[DONE]') return

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    return
  }

  const delta = parsed?.choices?.[0]?.delta
  if (!delta) return

  if (delta.reasoning_content) {
    onThinking(delta.reasoning_content)
    writer.sendThinking(delta.reasoning_content)
  }

  if (delta.content) {
    onAnswer(delta.content)
    writer.sendAnswer(delta.content)
  }
}
