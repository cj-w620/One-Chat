/**
 * 路由保护中间件
 */

import { withAuth } from 'next-auth/middleware'

/**
 * 路由保护中间件
 * 未登录用户访问受保护路由时自动跳转到登录页
 */
export default withAuth({
  pages: {
    signIn: '/login',
  },
})

/**
 * 需要保护的路由配置
 */
export const config = {
  matcher: [
    '/',
    '/api/chat/:path*',
    '/api/conversations/:path*',
  ],
}
