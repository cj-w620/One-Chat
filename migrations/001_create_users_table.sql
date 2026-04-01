/**
 * 文件名：001_create_users_table.sql
 * 功能：创建用户表
 * 作者：WJC
 * 创建时间：2024-04-01
 */

-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) NOT NULL DEFAULT 'credentials',
  provider_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);

-- 添加注释
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.email IS '用户邮箱（唯一）';
COMMENT ON COLUMN users.name IS '用户昵称';
COMMENT ON COLUMN users.password_hash IS '密码哈希值（bcrypt 加密）';
COMMENT ON COLUMN users.avatar_url IS '用户头像 URL';
COMMENT ON COLUMN users.provider IS '登录方式：credentials、github、google';
COMMENT ON COLUMN users.provider_id IS '第三方登录的用户 ID';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '最后更新时间';
