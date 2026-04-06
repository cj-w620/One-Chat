import type { Tool } from './types'

interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  results: TavilySearchResult[]
}

/**
 * 调用 Tavily 搜索 API
 */
async function searchTavily(
  apiKey: string,
  query: string
): Promise<{ content: string; sources: string[]; resultCount: number }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`)
    }

    const data: TavilyResponse = await response.json()

    const content = data.results
      .map((result, index) =>
        `${index + 1}. ${result.title}\n${result.content}\n来源: ${result.url}`
      )
      .join('\n\n')

    const sources = data.results.map(r => r.url)

    return {
      content,
      sources,
      resultCount: data.results.length,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 创建网络搜索工具
 */
export function createWebSearchTool(apiKey: string): Tool {
  return {
    name: 'web_search',
    description: '搜索互联网获取 2025 年及以后的最新信息。当用户询问最新新闻、实时数据、当前事件或任何需要最新信息的问题时，必须使用此工具。',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词，应该简洁明确',
        },
      },
      required: ['query'],
    },
    execute: async (args) => {
      const query = args.query as string

      if (!query) {
        throw new Error('Missing required parameter: query')
      }

      const result = await searchTavily(apiKey, query)
      return JSON.stringify(result)
    },
  }
}
