/**
 * 图片消息展示组件
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface ImageMessageProps {
  imageUrl: string
  prompt?: string
}

export default function ImageMessage({ imageUrl, prompt }: ImageMessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="space-y-2">
        {prompt && <p className="text-sm text-gray-600">{prompt}</p>}
        <div
          className="relative h-64 w-64 cursor-pointer overflow-hidden rounded-lg border"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={imageUrl}
            alt={prompt || '生成的图片'}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setIsModalOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={imageUrl}
              alt={prompt || '生成的图片'}
              width={1024}
              height={1024}
              className="h-auto w-auto max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
