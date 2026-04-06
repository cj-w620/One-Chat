import { ToolRegistry } from './registry'
import { createWebSearchTool } from './web-search'
import { createImageGenerationTool } from './image-generation'

const toolRegistry = new ToolRegistry()

let toolsInitialized = false

/**
 * 初始化工具
 */
export async function initTools(): Promise<void> {
  if (toolsInitialized) {
    return
  }

  console.log('Initializing tools...')

  const tavilyApiKey = process.env.TAVILY_API_KEY
  if (tavilyApiKey) {
    try {
      const webSearchTool = createWebSearchTool(tavilyApiKey)
      toolRegistry.register(webSearchTool)
      console.log('✓ Web search tool registered')
    } catch (error) {
      console.error('Failed to register web search tool:', error)
    }
  } else {
    console.warn('⚠ TAVILY_API_KEY not found, web search tool disabled')
  }

  const siliconflowApiKey = process.env.SILICONFLOW_API_KEY
  if (siliconflowApiKey) {
    try {
      const imageGenTool = createImageGenerationTool(siliconflowApiKey)
      toolRegistry.register(imageGenTool)
      console.log('✓ Image generation tool registered')
    } catch (error) {
      console.error('Failed to register image generation tool:', error)
    }
  } else {
    console.warn('⚠ SILICONFLOW_API_KEY not found, image generation tool disabled')
  }

  toolsInitialized = true
  console.log(`Tools initialized: ${toolRegistry.getAll().length} tools available`)
}

/**
 * 确保工具已初始化
 */
export async function ensureToolsReady(): Promise<void> {
  if (!toolsInitialized) {
    await initTools()
  }
}

/**
 * 获取工具注册表
 */
export function getToolRegistry(): ToolRegistry {
  return toolRegistry
}

export * from './types'
export * from './handler'
