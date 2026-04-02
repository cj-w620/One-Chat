/**
 * 用户注册 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { register } from '@/server/services/authService'
import type { RegisterParams } from '@/types/user'

/**
 * 用户注册接口
 * @security 密码使用 bcrypt 加密，不存储明文
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterParams = await request.json()
    const { email, password, confirmPassword, name } = body

    // 验证必填字段
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      )
    }

    // 验证密码长度和复杂度
    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码至少需要 8 位' },
        { status: 400 }
      )
    }

    // 验证密码包含字母和数字
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: '密码必须包含字母和数字' },
        { status: 400 }
      )
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: '两次密码不一致' },
        { status: 400 }
      )
    }

    // 调用注册服务
    const user = await register(email, password, name)

    return NextResponse.json(
      {
        message: '注册成功',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('注册失败:', error)

    // 处理已存在的邮箱
    if (error instanceof Error && error.message === '邮箱已被注册') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
