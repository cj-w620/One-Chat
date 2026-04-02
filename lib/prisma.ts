/**
 * Prisma Client 单例，避免开发环境热重载时创建多个实例
 */

import { PrismaClient } from '@prisma/client'

/**
 * 全局 Prisma Client 实例声明
 * 在开发环境中复用同一个实例，避免连接池耗尽
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * 全局 Prisma Client 实例
 * 在开发环境中复用同一个实例，避免连接池耗尽
 * 在生产环境中每次都创建新实例
 */
export const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
