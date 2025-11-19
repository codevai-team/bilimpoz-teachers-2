'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import TelegramConnectionForm from './TelegramConnectionForm'
import { useTranslation } from '@/hooks/useTranslation'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    language: 'ru' as 'ru' | 'kg'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTelegramForm, setShowTelegramForm] = useState(false)
  const [registeredUser, setRegisteredUser] = useState<{ login: string; name: string; id?: string; password?: string; language?: 'ru' | 'kg' } | null>(null)
  const { t, language, changeLanguage, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Устанавливаем язык по умолчанию из cookie или i18n при первой загрузке
  useEffect(() => {
    if (language && !mounted) {
      setFormData(prev => ({ ...prev, language: language === 'ky' ? 'kg' : 'ru' }))
    }
  }, [language, mounted])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key) || fallback
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = getText('auth.register.errors.nameRequired', 'Имя обязательно для заполнения')
    } else if (formData.name.trim().length < 2) {
      newErrors.name = getText('auth.register.errors.nameMinLength', 'Имя должно содержать минимум 2 символа')
    }

    if (!formData.login.trim()) {
      newErrors.login = getText('auth.register.errors.loginRequired', 'Логин обязателен для заполнения')
    } else if (formData.login.trim().length < 3) {
      newErrors.login = getText('auth.register.errors.loginMinLength', 'Логин должен содержать минимум 3 символа')
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.login)) {
      newErrors.login = getText('auth.register.errors.loginInvalid', 'Логин может содержать только буквы, цифры и знак подчеркивания')
    }

    if (!formData.password.trim()) {
      newErrors.password = getText('auth.register.errors.passwordRequired', 'Пароль обязателен для заполнения')
    } else if (formData.password.length < 8) {
      newErrors.password = getText('auth.register.errors.passwordMinLength', 'Пароль должен содержать минимум 8 символов')
    } else if (formData.password.length > 50) {
      newErrors.password = getText('auth.register.errors.passwordMaxLength', 'Пароль не должен превышать 50 символов')
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.name.trim(),
          login: formData.login.trim(),
          password: formData.password,
          language: formData.language
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Успешная регистрация - показываем форму подключения Telegram
        if (data.data) {
          setRegisteredUser({
            login: data.data.login,
            name: data.data.name,
            id: data.data.id,
            password: formData.password, // Сохраняем пароль для автоматического входа
            language: data.data.language || formData.language // Язык из БД или из формы
          })
          setShowTelegramForm(true)
        } else {
          // Если нет данных, перенаправляем на вход
        router.push('/login?registered=true')
        }
      } else {
        // Если пользователь существует, но не подключен Telegram
        if (data.data?.needsTelegram) {
          setRegisteredUser({
            login: data.data.login,
            name: data.data.name,
            id: data.data.id,
            password: formData.password, // Сохраняем пароль для автоматического входа
            language: data.data.language || formData.language // Язык из БД или из формы
          })
          setShowTelegramForm(true)
      } else {
        setErrors({ general: data.message || getText('auth.register.errors.general', 'Ошибка регистрации') })
        }
      }
    } catch (error) {
      console.error('Register error:', error)
      setErrors({ general: getText('auth.register.errors.general', 'Произошла ошибка при регистрации') })
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

  // Если показываем форму подключения Telegram
  if (showTelegramForm && registeredUser) {
    return (
      <TelegramConnectionForm 
        login={registeredUser.login} 
        name={registeredUser.name} 
        userId={registeredUser.id}
        password={registeredUser.password}
        language={registeredUser.language}
        onBack={() => {
          setShowTelegramForm(false)
          setRegisteredUser(null)
        }}
      />
    )
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-3xl p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1.5">
          {getText('auth.register.title', 'Регистрация')}
        </h2>
        <p className="text-[var(--text-tertiary)]">
          {getText('auth.register.subtitle', 'Создайте аккаунт преподавателя')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <p className="text-red-400 text-xs">{errors.general}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {getText('auth.register.fullName', 'Полное имя')} <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={getText('auth.register.fullNamePlaceholder', 'Введите ваше полное имя')}
            error={errors.name}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {getText('auth.register.login', 'Логин')} <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={formData.login}
            onChange={(e) => handleInputChange('login', e.target.value)}
            placeholder={getText('auth.register.loginPlaceholder', 'Введите логин')}
            error={errors.login}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            {getText('auth.register.language', 'Язык преподавателя')} <span className="text-red-400">*</span>
          </label>
          <Select
            value={formData.language}
            onChange={(value) => handleInputChange('language', value)}
            options={[
              { value: 'ru', label: getText('auth.register.languageRu', 'Русский') },
              { value: 'kg', label: getText('auth.register.languageKg', 'Кыргызский') }
            ]}
            placeholder={getText('auth.register.languagePlaceholder', 'Выберите язык')}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              {getText('auth.register.password', 'Пароль')} <span className="text-red-400">*</span>
            </label>
            <div className="group relative">
              <Icons.Info className="h-4 w-4 text-[var(--text-tertiary)] cursor-help hover:text-[var(--text-secondary)] transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 pointer-events-none">
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-3 shadow-xl">
                  <p className="text-xs text-[var(--text-primary)] font-medium mb-2">
                    {getText('auth.register.passwordRequirements', 'Требования к паролю:')}
                  </p>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                    <li>{getText('auth.register.passwordReqMin', 'Минимум 8 символов')}</li>
                    <li>{getText('auth.register.passwordReqMax', 'Максимум 50 символов')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => {
                // Ограничение длины пароля
                const value = e.target.value
                if (value.length <= 50) {
                  handleInputChange('password', value)
                }
              }}
              placeholder={getText('auth.register.passwordPlaceholder', 'Введите пароль')}
              error={errors.password}
              disabled={isLoading}
              maxLength={50}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
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
          className="w-full !bg-[var(--bg-tertiary)] !text-[var(--text-primary)] !border-2 !border-[var(--border-primary)] hover:!bg-[var(--bg-hover)] focus:!ring-0 focus:!border-[var(--border-primary)] focus:!outline-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[var(--text-tertiary)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
              {getText('auth.register.registering', 'Регистрация...')}
            </div>
          ) : (
            getText('auth.register.registerButton', 'Зарегистрироваться')
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-[var(--text-tertiary)] text-sm">
          {getText('auth.register.alreadyHaveAccount', 'Уже есть аккаунт?')}{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-[var(--accent-primary)] hover:underline"
          >
            {getText('auth.register.signIn', 'Войти')}
          </button>
        </p>
      </div>
    </div>
  )
}
