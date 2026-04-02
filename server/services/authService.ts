/**
 * 用户认证业务逻辑，使用 Prisma 操作数据库
 */

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

/**
 * 用户注册参数
 */
export interface RegisterParams {
  email: string
  password: string
  name?: string
}

/**
 * 用户注册
 * @param email - 用户邮箱
 * @param password - 用户密码（明文，将被加密）
 * @param name - 用户昵称（可选）
 * @returns 创建的用户对象（不包含密码）
 * @throws {Error} 邮箱已存在时抛出错误
 * @security 密码使用 bcrypt 加密（10 轮），不存储明文
 */
export async function register(
  email: string,
  password: string,
  name?: string
): Promise<Omit<User, 'passwordHash'>> {
  // 检查邮箱是否已存在
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('邮箱已被注册')
  }

  // 加密密码（10 轮）
  const passwordHash = await bcrypt.hash(password, 10)

  // 创建用户
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || email.split('@')[0], // 默认使用邮箱前缀作为昵称
      provider: 'credentials',
    },
  })

  // 返回用户信息（不包含密码）
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 验证密码
 * @param password - 明文密码
 * @param hash - 加密后的密码哈希
 * @returns 密码是否匹配
 * @security 使用 bcrypt.compare 进行安全比对
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * 根据邮箱查找用户
 * @param email - 用户邮箱
 * @returns 用户对象（包含密码哈希）或 null
 */
export async function findUserByEmail(
  email: string
): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  })
}

/**
 * 根据 ID 查找用户
 * @param id - 用户 ID
 * @returns 用户对象（不包含密码）或 null
 */
export async function findUserById(
  id: string
): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    return null
  }

  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}
