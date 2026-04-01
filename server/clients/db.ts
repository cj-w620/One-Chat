/**
 * 文件名：db.ts
 * 功能：PostgreSQL 数据库连接配置
 * 作者：WJC
 * 创建时间：2024-04-01
 */

import { Pool } from 'pg'

/**
 * 数据库连接池
 * 使用环境变量 DATABASE_URL 配置连接
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
})

/**
 * 数据库查询方法
 * @param text - SQL 查询语句
 * @param params - 查询参数
 * @returns 查询结果
 */
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}

/**
 * 获取数据库客户端（用于事务）
 * @returns 数据库客户端
 */
export const getClient = () => {
  return pool.connect()
}

export default pool
