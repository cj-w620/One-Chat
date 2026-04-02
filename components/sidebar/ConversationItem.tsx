/**
 * 会话项组件
 */

'use client'

import { Conversation } from '@/types/chat'
import { MessageSquare, Trash2 } from 'lucide-react'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-gray-200'
          : 'hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{conversation.title}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
        aria-label="删除会话"
      >
        <Trash2 className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}