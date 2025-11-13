'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Icons } from '@/components/ui/Icons'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const { loadUser } = useAuth()

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.login.trim()) {
      newErrors.login = 'Логин обязателен для заполнения'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязателен для заполнения'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requiresTelegram) {
          // Перенаправляем на страницу верификации Telegram
          router.push(`/verify-telegram?userId=${data.userId}`)
        } else {
          // Успешный вход без 2FA
          await loadUser()
          router.push('/dashboard')
        }
      } else {
        setErrors({ general: data.message || 'Ошибка входа' })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Произошла ошибка при входе' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
    if (errors.general) {
      setErrors({ ...errors, general: '' })
    }
  }

  return (
    <div className="bg-[#151515] rounded-3xl p-8 border border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Добро пожаловать!
        </h2>
        <p className="text-gray-400">
          Войдите в свой аккаунт преподавателя
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{errors.general}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Логин
          </label>
          <Input
            type="text"
            value={formData.login}
            onChange={(e) => handleInputChange('login', e.target.value)}
            placeholder="Введите ваш логин"
            error={errors.login}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Пароль
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Введите ваш пароль"
              error={errors.password}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <Icons.EyeOff className="h-5 w-5" />
              ) : (
                <Icons.Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Вход...
            </div>
          ) : (
            'Войти'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Нет аккаунта?{' '}
          <a href="#" className="text-white hover:underline">
            Обратитесь к администратору
          </a>
        </p>
      </div>
    </div>
  )
}

