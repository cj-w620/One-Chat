import type { Tool } from './types'
import * as fs from 'fs/promises'
import * as path from 'path'

interface ImageGenerationArgs {
  prompt: string
  negative_prompt?: string
  image_size?: string
}

interface ImageGenerationResult {
  imageUrl: string
  localUrl: string
  width: number
  height: number
}

/**
 * 调用 SiliconFlow 图片生成 API
 */
async function generateImage(
  apiKey: string,
  args: ImageGenerationArgs
): Promise<ImageGenerationResult> {
  const { prompt, negative_prompt, image_size = '1024x1024' } = args

  const [width, height] = image_size.split('x').map(Number)

  const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'Kwai-Kolors/Kolors',
      prompt,
      negative_prompt,
      image_size,
      batch_size: 1,
      num_inference_steps: 25,
    }),
  })

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status}`)
  }

  const data = await response.json()
  const imageUrl = data.images[0].url

  const localUrl = await downloadAndSaveImage(imageUrl)

  return {
    imageUrl,
    localUrl,
    width,
    height,
  }
}

/**
 * 下载并保存图片
 */
async function downloadAndSaveImage(url: string): Promise<string> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()

  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  const filename = `${timestamp}-${randomId}.png`

  const dir = path.join(process.cwd(), 'public', 'generated')
  await fs.mkdir(dir, { recursive: true })

  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, Buffer.from(buffer))

  return `/generated/${filename}`
}

/**
 * 创建图片生成工具
 */
export function createImageGenerationTool(apiKey: string): Tool {
  return {
    name: 'generate_image',
    description: '生成图片。当用户要求生成、创作、画、绘制任何图片时，必须调用此工具。',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图片描述，必须使用英文。应该详细描述图片的内容、风格、色彩等。',
        },
        negative_prompt: {
          type: 'string',
          description: '不希望出现在图片中的内容，使用英文。',
        },
        image_size: {
          type: 'string',
          description: '图片尺寸',
          enum: ['1024x1024', '512x1024', '768x512', '768x1024', '1024x576', '576x1024'],
        },
      },
      required: ['prompt'],
    },
    execute: async (args) => {
      const result = await generateImage(apiKey, args as unknown as ImageGenerationArgs)
      return JSON.stringify(result)
    },
  }
}
