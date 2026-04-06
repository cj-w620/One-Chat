import type { ToolCall } from '@/server/tools/types'
import { executeToolCalls, formatToolMessages } from '@/server/tools/handler'
import { getToolRegistry } from '@/server/tools'
import { SSEWriter } from './sse-writer'
import { siliconflowClient } from '@/server/clients/siliconflowClient'
import { saveMessage } from './conversationService'
import type { Message } from '@/types/chat'

interface StreamContext {
  model: string
  messages: Message[]
  sessionId?: string
  conversationId?: string
}

function isCompleteJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export function createSSEStreamWithTools(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  context: StreamContext
): ReadableStream {
  const { model, messages, sessionId, conversationId } = context
  const toolRegistry = getToolRegistry()

  return new ReadableStream({
    async start(controller) {
      const sseWriter = new SSEWriter(controller)

      let thinkingContent = ''
      let answerContent = ''
      let currentToolCalls: ToolCall[] = []
      let toolCallsMap = new Map<string, { name: string; arguments: string }>()

      const decoder = new TextDecoder()
      let buffer = ''

      let roundCount = 0
      const MAX_ROUNDS = 5

      async function processStream(
        streamReader: ReadableStreamDefaultReader<Uint8Array>,
        currentMessages: Message[]
      ): Promise<void> {
        roundCount++

        if (roundCount > MAX_ROUNDS) {
          console.warn('Max tool call rounds reached')
          return
        }

        try {
          while (true) {
            const { done, value } = await streamReader.read()

            if (done) {
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) {
                continue
              }

              const data = line.slice(6).trim()

              if (data === '[DONE]') {
                continue
              }

              try {
                const parsed = JSON.parse(data)
                const choice = parsed.choices?.[0]

                if (!choice) continue

                const delta = choice.delta

                if (delta.thinking_content) {
                  thinkingContent += delta.thinking_content
                  await sseWriter.writeThinking(delta.thinking_content, sessionId)
                }

                if (delta.content) {
                  // 过滤掉 XML 标签（某些模型会输出 <tool_call> 等标签）
                  let content = delta.content

                  // 移除工具调用相关的 XML 标签
                  content = content.replace(/<\/?tool_call[^>]*>/g, '')
                  content = content.replace(/<\/?function_calls[^>]*>/g, '')

                  // 移除开头的多余符号（如 }, ], 等）
                  if (answerContent === '' && content.trim()) {
                    content = content.replace(/^[\}\]\)]+\s*/, '')
                  }

                  if (content) {
                    answerContent += content
                    await sseWriter.writeAnswer(content, sessionId)
                  }
                }

                if (delta.tool_calls) {
                  for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index
                    const id = toolCall.id
                    const name = toolCall.function?.name
                    const args = toolCall.function?.arguments || ''

                    if (!toolCallsMap.has(String(index))) {
                      toolCallsMap.set(String(index), {
                        name: name || '',
                        arguments: '',
                      })
                    }

                    const existing = toolCallsMap.get(String(index))!

                    if (name) {
                      existing.name = name
                    }

                    existing.arguments += args

                    if (isCompleteJSON(existing.arguments)) {
                      const parsedArgs = JSON.parse(existing.arguments)

                      await sseWriter.writeToolCall(
                        id || `call_${index}`,
                        existing.name,
                        parsedArgs,
                        sessionId
                      )
                    }
                  }
                }

                if (choice.finish_reason === 'tool_calls') {
                  currentToolCalls = Array.from(toolCallsMap.entries()).map(
                    ([index, data]) => ({
                      id: `call_${index}`,
                      type: 'function' as const,
                      function: {
                        name: data.name,
                        arguments: data.arguments,
                      },
                    })
                  )
                }
              } catch (error) {
                console.error('Failed to parse SSE data:', error)
              }
            }
          }

          if (currentToolCalls.length > 0) {
            console.log(`Executing ${currentToolCalls.length} tool calls...`)

            const toolResults = await executeToolCalls(currentToolCalls, toolRegistry)

            for (const result of toolResults) {
              const resultData = JSON.parse(result.content)
              await sseWriter.writeToolResult(
                result.toolCallId,
                result.name,
                result.success,
                resultData,
                sessionId
              )
            }

            const assistantMessage: Message = {
              id: Date.now().toString(),
              conversationId: conversationId || '',
              role: 'assistant',
              content: answerContent || '',
              type: 'text',
              imageUrl: null,
              toolCalls: currentToolCalls as any,
              toolCallId: null,
              name: null,
              createdAt: new Date(),
            }

            const toolMessages = formatToolMessages(toolResults).map(tm => ({
              id: (Date.now() + 1).toString(),
              conversationId: conversationId || '',
              role: 'tool' as const,
              content: tm.content,
              type: 'text' as const,
              imageUrl: null,
              toolCalls: null,
              toolCallId: tm.tool_call_id,
              name: null,
              createdAt: new Date(),
            }))

            const nextMessages = [...currentMessages, assistantMessage, ...toolMessages]

            thinkingContent = ''
            answerContent = ''
            currentToolCalls = []
            toolCallsMap.clear()

            const toolDefinitions = toolRegistry.getToolDefinitions()
            const nextStream = await siliconflowClient.chatStream({
              model,
              messages: nextMessages,
              tools: toolDefinitions,
            })

            const nextReader = nextStream.getReader()
            if (nextReader) {
              await processStream(nextReader, nextMessages)
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error)
          throw error
        }
      }

      try {
        await processStream(reader, messages)

        // 保存最终的 AI 消息到数据库
        if (conversationId && answerContent) {
          await saveMessage(conversationId, 'assistant', answerContent)
        }

        await sseWriter.writeComplete(sessionId)
      } catch (error) {
        console.error('Stream error:', error)
        controller.error(error)
      } finally {
        try {
          await sseWriter.close()
        } catch (e) {
          // Controller might already be closed
        }
      }
    },
  })
}
