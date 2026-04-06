'use client'

import { useChat } from '@/hooks/useChat'
import { ChatList } from '@/components/chat/ChatList'
import { ChatInput } from '@/components/chat/ChatInput'
import { useConversationStore } from '@/store/conversationStore'

export default function Home() {
  const { messages, isLoading, streamingMessageId, sendMessage, abortStream } =
    useChat()
  const { currentId, conversations } = useConversationStore()

  const currentConversation = conversations.find((c) => c.id === currentId)

  return (
    <main className="flex flex-col h-full bg-white">
      {/* 顶部标题栏 */}
      <header className="border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-800">
          {currentConversation
            ? currentConversation.title
            : '请选择或创建一个会话'}
        </h1>
      </header>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentId ? (
          <ChatList
            messages={messages}
            streamingMessageId={streamingMessageId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">欢迎使用 OneChat</p>
              <p className="text-sm">点击左侧"新聊天"开始对话</p>
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      {currentId && (
        <ChatInput
          onSend={sendMessage}
          onStop={isLoading ? abortStream : undefined}
          disabled={false}
        />
      )}
    </main>
  )
}
