import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'One Chat - AI 对话助手',
  description: '基于硅基流动 API 的 AI 对话应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
