'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'

const TelegramVerificationForm: React.FC = () => {
  const router = useRouter()
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 минут в секундах
  const [userId, setUserId] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Получаем userId из localStorage или параметров
  useEffect(() => {
    const pendingVerification = localStorage.getItem('pendingVerification')
    if (pendingVerification) {
      try {
        const data = JSON.parse(pendingVerification)
        setUserId(data.userId)
      } catch (e) {
        console.error('Error parsing pending verification:', e)
      }
    }
  }, [])

  // Таймер обратного отсчета
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleInputChange = (index: number, value: string) => {
    // Разрешаем только цифры
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Очищаем ошибку при вводе
    if (error) setError('')

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace возвращает к предыдущему полю
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    // Проверяем, что вставлены только цифры
    if (!/^\d{6}$/.test(pastedData)) return

    const newCode = pastedData.split('')
    setCode(newCode)
    
    // Фокус на последнее поле
    inputRefs.current[5]?.focus()
    
    // Очищаем ошибку
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const codeString = code.join('')
    if (codeString.length !== 6) {
      setError('Введите полный 6-значный код')
      return
    }

    if (!userId) {
      setError('Ошибка: не найден ID пользователя')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          code: codeString,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Неверный код подтверждения')
      }

      // Сохраняем токен и данные пользователя
      if (data.token) {
        const { setAuthToken, setUserCookie } = await import('@/lib/client-auth')
        setAuthToken(data.token)
        setUserCookie(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Удаляем данные о pending verification
      localStorage.removeItem('pendingVerification')

      // После успешной проверки перенаправляем на главную
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Неверный код подтверждения')
      // Очищаем поля и возвращаем фокус на первое поле
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!userId) {
      setError('Ошибка: не найден ID пользователя')
      return
    }

    setError('')
    setTimeLeft(300) // Сбрасываем таймер
    
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось отправить код повторно')
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить код повторно')
    }
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="rounded-2xl p-10 shadow-2xl" style={{ backgroundColor: '#151515' }}>
      {/* Заголовок формы */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-500/20 p-3 rounded-full">
            <Icons.MessageCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Подтверждение входа</h2>
        <p className="text-gray-400 text-sm">
          Введите 6-значный код, отправленный в ваш Telegram
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Поля ввода кода */}
        <div>
          <label className="block text-sm font-medium text-white mb-4">
            Код подтверждения
          </label>
          <div className="flex gap-3 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`
                  w-12 h-14 text-center text-xl font-bold
                  text-white placeholder-gray-400
                  rounded-xl border-2
                  focus:outline-none focus:border-white
                  hover:border-gray-500
                  transition-all duration-300 ease-in-out
                  ${error ? 'border-red-400' : 'border-gray-600'}
                  ${digit ? 'border-white bg-white/10' : ''}
                `}
                style={{
                  backgroundColor: digit ? undefined : '#0b0b0b'
                }}
              />
            ))}
          </div>
        </div>

        {/* Таймер и повторная отправка */}
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-400">
              Код действителен еще: <span className="text-white font-mono">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
            >
              Отправить ещё
            </button>
          )}
        </div>

        {/* Блок ошибок */}
        {error && (
          <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Кнопки формы */}
        <div className="space-y-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
            disabled={code.join('').length !== 6}
          >
            {isLoading ? 'Проверка кода...' : 'Подтвердить'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-gray-400 hover:text-gray-300 transition-colors text-sm inline-flex items-center gap-2"
            >
              <Icons.ArrowLeft className="w-4 h-4" />
              Вернуться к входу
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default TelegramVerificationForm

