/**
 * NextAuth.js 认证配置
 */

import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import {
  findUserByEmail,
  verifyPassword,
  findOrCreateOAuthUser,
} from '@/server/services/authService'

/**
 * NextAuth 配置选项
 * @security 使用 JWT session，密码验证使用 bcrypt
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // 邮箱密码登录
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码')
        }

        // 查找用户
        const user = await findUserByEmail(credentials.email)
        if (!user || !user.passwordHash) {
          throw new Error('邮箱或密码错误')
        }

        // 验证密码
        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('邮箱或密码错误')
        }

        // 返回用户信息（不包含密码）
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        }
      },
    }),

    // GitHub 登录
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Google 登录
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 处理第三方登录
      if (account?.provider === 'github' || account?.provider === 'google') {
        try {
          // 查找或创建 OAuth 用户
          const dbUser = await findOrCreateOAuthUser(
            account.provider,
            account.providerAccountId,
            {
              email: user.email!,
              name: user.name || undefined,
              avatarUrl: user.image || undefined,
            }
          )

          // 更新 user 对象，确保使用数据库中的 ID
          user.id = dbUser.id
          return true
        } catch (error) {
          console.error('OAuth 登录失败:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      // 首次登录时，将用户信息添加到 token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      // 将 token 中的用户信息添加到 session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
