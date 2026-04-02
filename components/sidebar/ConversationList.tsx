/**
 * 会话列表组件
 */

'use client'

import { useConversationStore } from '@/store/conversationStore'
import { ConversationItem } from './ConversationItem'

export function ConversationList() {
  const { conversations, currentId, setCurrentId, deleteConversation, loadMessages } =
    useConversationStore()

  const handleSelect = async (id: string) => {
    setCurrentId(id)
    await loadMessages(id)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个会话吗？')) {
      await deleteConversation(id)
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-400">
        暂无会话
      </div>
    )
  }

  return (
    <div className="py-2 px-2 space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === currentId}
          onClick={() => handleSelect(conversation.id)}
          onDelete={() => handleDelete(conversation.id)}
        />
      ))}
    </div>
  )
}