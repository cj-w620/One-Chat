/**
 * 文件名：init-db.ts
 * 功能：初始化数据库表结构
 * 作者：WJC
 * 创建时间：2024-04-01
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import pool from '../server/clients/db'

/**
 * 执行数据库迁移
 */
async function initDatabase() {
  try {
    console.log('开始初始化数据库...')

    // 读取并执行用户表迁移
    const usersMigration = readFileSync(
      join(process.cwd(), 'migrations', '001_create_users_table.sql'),
      'utf-8'
    )

    await pool.query(usersMigration)
    console.log('✅ 用户表创建成功')

    console.log('数据库初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('数据库初始化失败：', error)
    process.exit(1)
  }
}

initDatabase()
