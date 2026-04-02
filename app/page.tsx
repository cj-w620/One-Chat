'use client'

import { useChat } from '@/hooks/useChat'
import { ChatList } from '@/components/chat/ChatList'
import { ChatInput } from '@/components/chat/ChatInput'
import UserMenu from '@/components/layout/UserMenu'

export default function Home() {
  const { messages, isLoading, error, sendMessage } = useChat()

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">One Chat</h1>
          <p className="text-sm text-muted-foreground">AI 对话助手</p>
        </div>
        <UserMenu />
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatList messages={messages} isLoading={isLoading} />

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </main>
  )
}
