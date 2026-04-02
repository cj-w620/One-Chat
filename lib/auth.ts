/**
 * 认证工具函数
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * 获取服务端 session
 * @returns session 对象或 null
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * 要求用户登录，未登录返回 null
 * @returns session 对象或 null
 */
export async function requireAuth() {
  const session = await getSession()
  return session
}
