/**
 * SiliconFlow AI 客户端
 *
 * 职责：
 * 1. 封装对 SiliconFlow（OpenAI 兼容）API 的 HTTP 调用
 * 2. 返回原始 ReadableStream，不做任何解析
 * 3. 不包含任何业务逻辑
 */

import type { Tool } from '@/types/chat'
import type { ApiMessage } from '../chat/prompt.builder'

/** createChatCompletion 的入参 */
export interface ChatCompletionParams {
  model: string
  messages: ApiMessage[]
  tools?: Tool[]
  stream?: boolean
}

/** createChatCompletion 的返回值 */
export interface ChatCompletionResult {
  /** 原始 SSE ReadableStream，逐块推送 AI 响应 */
  reader: ReadableStreamDefaultReader<Uint8Array>
}

const BASE_URL = 'https://api.siliconflow.cn/v1'

/**
 * 调用 SiliconFlow 流式 Chat Completion API
 *
 * @param apiKey - 用于鉴权的 API Key
 * @param params - 请求参数（model / messages / tools）
 * @returns reader  原始流 reader，由调用方负责消费
 * @throws  网络错误或 API 返回非 2xx 状态码时抛出
 */
export async function createChatCompletion(
  apiKey: string,
  params: Omit<ChatCompletionParams, 'stream'>
): Promise<ChatCompletionResult> {
  const body: ChatCompletionParams = {
    ...params,
    stream: true,
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`SiliconFlow API Error: ${response.status} - ${errorText}`)
  }

  if (!response.body) {
    throw new Error('SiliconFlow API returned empty response body')
  }

  return { reader: response.body.getReader() }
}

/**
 * 调用 SiliconFlow 图片生成 API
 *
 * @param apiKey  - API Key
 * @param prompt  - 图片描述（须为英文）
 * @param options - 可选参数（model / image_size / negative_prompt）
 * @returns 生成图片的 URL
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  options?: {
    model?: string
    image_size?: string
    negative_prompt?: string
  }
): Promise<string> {
  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model: options?.model ?? 'Kwai-Kolors/Kolors',
      image_size: options?.image_size ?? '1024x1024',
      negative_prompt: options?.negative_prompt,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`SiliconFlow Image API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const url = data?.images?.[0]?.url
  if (!url) throw new Error('SiliconFlow image generation returned no URL')
  return url
}
