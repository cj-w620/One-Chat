/**
 * 用户菜单组件
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

export default function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 truncate">
          {session.user.name || session.user.email}
        </span>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        aria-label="登出"
      >
        <LogOut className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}
