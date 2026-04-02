/**
 * 侧边栏组件
 */

'use client'

import { useEffect } from 'react'
import { Plus, MessageSquare, Settings, HelpCircle, Menu, X } from 'lucide-react'
import { useConversationStore } from '@/store/conversationStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { ConversationList } from './ConversationList'
import UserMenu from '../layout/UserMenu'

export function Sidebar() {
  const { fetchConversations, createConversation } = useConversationStore()
  const { isCollapsed, toggleSidebar } = useSidebarStore()

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleNewChat = async () => {
    const title = `新对话 ${new Date().toLocaleString()}`
    await createConversation(title)
  }

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full w-16 bg-gray-50 border-r border-gray-200">
        <div className="flex items-center justify-center p-3 border-b border-gray-200">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-200 rounded"
            aria-label="展开菜单"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center gap-4 py-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="p-2 hover:bg-gray-200 rounded"
            aria-label="新聊天"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-64 bg-gray-50 border-r border-gray-200">
      {/* 顶部：Logo 和折叠按钮 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-lg">OneChat</span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 hover:bg-gray-200 rounded"
          aria-label="收起菜单"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 新建对话按钮 */}
      <div className="p-3">
        <button
          type="button"
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新聊天
        </button>
      </div>

      {/* 中间：会话列表 */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>

      {/* 底部：设置和用户信息 */}
      <div className="border-t border-gray-200">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">设置</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">帮助</span>
        </button>
        <div className="p-3 border-t border-gray-200">
          <UserMenu />
        </div>
      </div>
    </div>
  )
}