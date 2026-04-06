import type { Tool, OpenAIToolDefinition, IToolRegistry } from './types'

/**
 * 工具注册表实现
 */
export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, Tool> = new Map()

  /**
   * 注册工具
   */
  register(tool: Tool): void {
    if (!tool.name || !tool.description || !tool.parameters || !tool.execute) {
      throw new Error('Invalid tool definition: missing required fields')
    }

    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered, overwriting...`)
    }

    this.tools.set(tool.name, tool)
    console.log(`Tool registered: ${tool.name}`)
  }

  /**
   * 获取工具
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  /**
   * 检查工具是否存在
   */
  has(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 获取所有工具
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取 OpenAI 格式的工具定义
   */
  getToolDefinitions(): OpenAIToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))
  }

  /**
   * 按名称执行工具
   */
  async executeByName(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    const tool = this.tools.get(name)

    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    try {
      return await tool.execute(args)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Tool execution failed for "${name}": ${errorMessage}`)
    }
  }
}
