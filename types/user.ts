/**
 * 文件名：user.ts
 * 功能：用户相关类型定义
 * 作者：OneChat Team
 * 创建时间：2026-04-02
 */

import type { User as PrismaUser } from '@prisma/client'

/**
 * 用户信息类型（不包含密码哈希）
 * 从 Prisma 生成的 User 类型中排除 passwordHash 字段
 */
export type User = Omit<PrismaUser, 'passwordHash'>

/**
 * 用户注册参数
 */
export interface RegisterParams {
  /** 用户邮箱 */
  email: string
  /** 用户密码（明文） */
  password: string
  /** 确认密码 */
  confirmPassword: string
  /** 用户昵称（可选） */
  name?: string
}

/**
 * 用户登录参数
 */
export interface LoginParams {
  /** 用户邮箱 */
  email: string
  /** 用户密码（明文） */
  password: string
}
