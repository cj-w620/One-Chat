/**
 * 工具系统测试脚本
 */

import { initTools, getToolRegistry } from '../server/tools'

async function testToolSystem() {
  console.log('🧪 Testing Tool System...\n')

  try {
    // 1. 初始化工具
    console.log('1️⃣ Initializing tools...')
    await initTools()
    console.log('✅ Tools initialized\n')

    // 2. 获取工具注册表
    const registry = getToolRegistry()
    const tools = registry.getAll()
    console.log(`2️⃣ Registered tools: ${tools.length}`)
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`)
    })
    console.log()

    // 3. 获取工具定义
    const definitions = registry.getToolDefinitions()
    console.log('3️⃣ Tool definitions:')
    console.log(JSON.stringify(definitions, null, 2))
    console.log()

    // 4. 测试工具执行（如果有 API Key）
    if (process.env.TAVILY_API_KEY) {
      console.log('4️⃣ Testing web_search tool...')
      try {
        const result = await registry.executeByName('web_search', {
          query: 'latest AI news'
        })
        const parsed = JSON.parse(result)
        console.log(`✅ Search returned ${parsed.resultCount} results`)
        console.log(`   First result: ${parsed.sources?.[0] || 'N/A'}`)
      } catch (error) {
        console.log(`❌ Search failed: ${error instanceof Error ? error.message : error}`)
      }
    } else {
      console.log('4️⃣ Skipping web_search test (no TAVILY_API_KEY)')
    }
    console.log()

    console.log('✅ All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testToolSystem()
