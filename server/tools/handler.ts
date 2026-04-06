import type {
  ToolCall,
  ParsedToolCall,
  ToolCallResult,
  ToolMessage,
  IToolRegistry,
} from './types'

/**
 * 解析工具调用
 */
export function parseToolCalls(toolCalls: ToolCall[]): ParsedToolCall[] {
  return toolCalls.map(call => {
    try {
      const args = JSON.parse(call.function.arguments)
      return {
        id: call.id,
        name: call.function.name,
        arguments: args,
      }
    } catch (error) {
      console.error(`Failed to parse tool call arguments:`, error)
      return {
        id: call.id,
        name: call.function.name,
        arguments: {},
      }
    }
  })
}

/**
 * 执行单个工具
 */
export async function executeToolCall(
  parsedCall: ParsedToolCall,
  registry: IToolRegistry
): Promise<ToolCallResult> {
  try {
    const content = await registry.executeByName(
      parsedCall.name,
      parsedCall.arguments
    )

    return {
      toolCallId: parsedCall.id,
      name: parsedCall.name,
      content,
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Tool execution error:`, errorMessage)

    return {
      toolCallId: parsedCall.id,
      name: parsedCall.name,
      content: `Error: ${errorMessage}`,
      success: false,
    }
  }
}

/**
 * 批量执行工具（并行）
 */
export async function executeToolCalls(
  toolCalls: ToolCall[],
  registry: IToolRegistry
): Promise<ToolCallResult[]> {
  const parsedCalls = parseToolCalls(toolCalls)

  const results = await Promise.all(
    parsedCalls.map(call => executeToolCall(call, registry))
  )

  return results
}

/**
 * 格式化工具结果为消息
 */
export function formatToolMessage(result: ToolCallResult): ToolMessage {
  return {
    role: 'tool',
    tool_call_id: result.toolCallId,
    content: result.content,
  }
}

/**
 * 批量格式化工具消息
 */
export function formatToolMessages(results: ToolCallResult[]): ToolMessage[] {
  return results.map(formatToolMessage)
}
