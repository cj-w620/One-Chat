/**
 * 主应用布局（客户端）
 */

'use client'

import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  // 未登录时不显示侧边栏
  if (!session) {
    return <>{children}</>
  }

  // 登录后显示侧边栏布局
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}