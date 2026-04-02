/**
 * 用户菜单组件
 */

'use client'

import { signOut, useSession } from 'next-auth/react'

export default function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
            {session.user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-sm font-medium">{session.user.name}</span>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="rounded-md px-3 py-1 text-sm hover:bg-gray-100"
      >
        登出
      </button>
    </div>
  )
}
