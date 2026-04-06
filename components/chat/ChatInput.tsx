/**
 * ChatInput - 聊天输入框组件
 *
 * 支持 Enter 发送（Shift+Enter 换行），流式生成时显示停止按钮。
 */

'use client'

import { useState } from 'react'
import { Send, Paperclip, Mic, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => void
  /** 流式生成时，点击停止按钮调用 */
  onStop?: () => void
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const isStreaming = !!onStop

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled && !isStreaming) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-4">
      <form onSubmit={handleSubmit}>
        <div className="relative bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          {/* 输入框 */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="给消息或键入 / 选择技能"
            disabled={isStreaming}
            rows={1}
            className="w-full px-4 pt-3 pb-12 pr-12 resize-none border-none focus:outline-none rounded-2xl max-h-48 overflow-y-auto"
            style={{ minHeight: '102px', height: 'auto' }}
          />

          {/* 底部工具栏 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="附件"
              >
                <Paperclip className="w-4 h-4 text-gray-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="语音输入"
              >
                <Mic className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 流式中显示停止按钮，否则显示发送按钮 */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                aria-label="停止生成"
              >
                <Square className="w-4 h-4 text-red-600" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="发送消息"
              >
                <Send className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
