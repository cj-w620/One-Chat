/**
 * 用户注册页面
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import type { RegisterParams } from '@/types/user'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterParams>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      errors.email = '请输入邮箱'
    } else if (!emailRegex.test(formData.email)) {
      errors.email = '邮箱格式不正确'
    }

    // 密码长度校验
    if (!formData.password) {
      errors.password = '请输入密码'
    } else if (formData.password.length < 8) {
      errors.password = '密码至少需要 8 位'
    } else {
      // 密码复杂度校验（包含字母和数字）
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/
      if (!passwordRegex.test(formData.password)) {
        errors.password = '密码必须包含字母和数字'
      }
    }

    // 确认密码校验
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次密码不一致'
    }

    // 昵称长度校验（可选）
    if (formData.name && formData.name.length > 50) {
      errors.name = '昵称不能超过 50 个字符'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // 前端校验
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // 调用注册 API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '注册失败')
      }

      // 注册成功后自动登录
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('登录失败')
      }

      // 跳转到首页
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">注册账号</h2>
          <p className="mt-2 text-sm text-gray-600">
            创建你的 OneChat 账号
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                邮箱
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setFieldErrors({ ...fieldErrors, email: '' })
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  fieldErrors.email ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                昵称（可选）
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setFieldErrors({ ...fieldErrors, name: '' })
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  fieldErrors.name ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                密码
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  setFieldErrors({ ...fieldErrors, password: '' })
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  fieldErrors.password ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  至少 8 位，包含字母和数字
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium"
              >
                确认密码
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value })
                  setFieldErrors({ ...fieldErrors, confirmPassword: '' })
                }}
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  fieldErrors.confirmPassword ? 'border-red-500' : ''
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-gray-600">
            已有账号？
            <Link href="/login" className="ml-1 text-blue-600 hover:underline">
              去登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
