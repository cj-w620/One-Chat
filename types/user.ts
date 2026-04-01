/**
 * 文件名：user.ts
 * 功能：用户相关类型定义
 * 作者：WJC
 * 创建时间：2024-04-01
 */

/**
 * 用户信息类型
 */
export interface User {
  /** 用户唯一标识 */
  id: string
  /** 用户邮箱（唯一） */
  email: string
  /** 用户昵称 */
  name?: string
  /** 密码哈希值（bcrypt 加密） */
  passwordHash?: string
  /** 用户头像 URL */
  avatarUrl?: string
  /** 登录方式：credentials（邮箱密码）、github、google */
  provider: 'credentials' | 'github' | 'google'
  /** 第三方登录的用户 ID */
  providerId?: string
  /** 创建时间 */
  createdAt: Date
  /** 最后更新时间 */
  updatedAt: Date
}

/**
 * 用户注册参数
 */
export interface RegisterParams {
  /** 用户邮箱 */
  email: string
  /** 用户密码（明文） */
  password: string
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
