/**
 * 工具参数 Schema (JSON Schema 格式)
 */
export interface ToolParameterSchema {
  type: 'object'
  properties: Record<string, {
    type: string
    description: string
    enum?: string[]
  }>
  required: string[]
}

/**
 * 工具定义接口
 */
export interface Tool {
  name: string
  description: string
  parameters: ToolParameterSchema
  execute: (args: Record<string, unknown>) => Promise<string>
}

/**
 * OpenAI Function Calling 格式的工具定义
 */
export interface OpenAIToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: ToolParameterSchema
  }
}

/**
 * AI 返回的工具调用
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * 解析后的工具调用
 */
export interface ParsedToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

/**
 * 工具执行结果
 */
export interface ToolCallResult {
  toolCallId: string
  name: string
  content: string
  success: boolean
}

/**
 * 工具消息（发送给 AI）
 */
export interface ToolMessage {
  role: 'tool'
  tool_call_id: string
  content: string
}

/**
 * 工具注册表接口
 */
export interface IToolRegistry {
  register(tool: Tool): void
  get(name: string): Tool | undefined
  has(name: string): boolean
  getAll(): Tool[]
  getToolDefinitions(): OpenAIToolDefinition[]
  executeByName(name: string, args: Record<string, unknown>): Promise<string>
}
