// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

// 会话类型
export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

// 对话请求参数
export interface ChatParams {
  messages: Message[]
  model?: string
}

// 对话响应
export interface ChatResponse {
  message: Message
}
