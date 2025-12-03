'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

interface TelegramConnectionFormProps {
  login: string
  name: string
  userId?: string
  password?: string
  language?: 'ru' | 'kg'
  onBack?: () => void
}

const TelegramConnectionForm: React.FC<TelegramConnectionFormProps> = ({ 
  login, 
  name,
  userId,
  password,
  language = 'ru',
  onBack
}) => {
  const router = useRouter()
  const { t, ready } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [botUsername, setBotUsername] = useState('bilimpozteacher_bot')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key) || fallback
  }

  // Получаем username бота из API
  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        const response = await fetch('/api/telegram/bot-info')
        const data = await response.json()
        if (data.success && data.data?.botInfo?.username) {
          setBotUsername(data.data.botInfo.username)
        }
      } catch (error) {
        console.error('Error fetching bot info:', error)
        // Используем дефолтный username
      }
    }
    fetchBotInfo()
  }, [])

  // Формируем ссылку на бота с параметрами
  const getTelegramBotUrl = () => {
    // Используем язык пользователя из пропсов (из БД)
    const userLanguage = language === 'kg' ? 'kg' : 'ru'
    return `https://t.me/${botUsername}?start=register_${login}__${userLanguage}`
  }

  // Проверка подключения Telegram через API
  const checkTelegramConnection = async () => {
    if (!login) return

    setCheckingStatus(true)
    setError('')

    try {
      // Проверяем статус пользователя через API /api/user/me или создаем специальный endpoint
      // Пока используем простую проверку - если пользователь подключил Telegram, 
      // бот уже обновил данные в БД, и мы можем перенаправить на вход
      
      // Альтернатива: можно создать endpoint /api/auth/check-telegram-status
      // который проверяет наличие telegram_id у пользователя по логину
      
      // Временное решение: просто ждем и проверяем через некоторое время
      // В реальности лучше использовать WebSocket или Server-Sent Events
    } catch (error) {
      console.error('Error checking Telegram connection:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  // Обработка открытия Telegram
  const handleOpenTelegram = () => {
    const telegramUrl = getTelegramBotUrl()
    window.open(telegramUrl, '_blank')
    
    // Начинаем проверку подключения через 3 секунды
    setTimeout(() => {
      setCheckingStatus(true)
      
      const interval = setInterval(async () => {
        try {
          // Проверяем через API, есть ли у пользователя telegram_id
          const response = await fetch(`/api/auth/check-telegram?login=${encodeURIComponent(login)}`)
          const data = await response.json()
          
          if (data.success && data.connected) {
            clearInterval(interval)
            setCheckingStatus(false)
            // Telegram подключен - перенаправляем на страницу входа
            router.push('/login?telegramConnected=true')
          }
        } catch (error) {
          console.error('Error checking Telegram status:', error)
        }
      }, 3000) // Проверяем каждые 3 секунды

      // Останавливаем проверку через 5 минут
      setTimeout(() => {
        clearInterval(interval)
        setCheckingStatus(false)
      }, 5 * 60 * 1000)
    }, 3000)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/register')
    }
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-primary)]">
      {/* Индикатор шагов */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-active-button)] text-[var(--text-active-button)] flex items-center justify-center font-semibold text-sm">
            {getText('telegramConnection.stepIndicator.step1', '1')}
          </div>
          <div className="w-12 h-0.5 bg-[var(--border-primary)]"></div>
          <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] flex items-center justify-center font-semibold text-sm">
            {getText('telegramConnection.stepIndicator.step2', '2')}
          </div>
        </div>
      </div>

      {/* Инструкция */}
      <div className="text-center mb-6">
        <p className="text-[var(--text-primary)] text-base mb-6">
          {getText('telegramConnection.instruction', 'Нажмите кнопку ниже для подключения Telegram аккаунта')}
        </p>
      </div>

      {/* Кнопка "Войти в Telegram" */}
      <div className="mb-6">
        <button
          onClick={handleOpenTelegram}
          disabled={isLoading}
          className="w-full bg-[var(--bg-active-button)] text-[var(--text-active-button)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icons.Send className="w-5 h-5" />
          <span>{getText('telegramConnection.openTelegramButton', 'Войти в Telegram')}</span>
        </button>
      </div>

      {/* Дополнительная инструкция */}
      <div className="text-center mb-6">
        <p className="text-[var(--text-tertiary)] text-sm">
          {getText('telegramConnection.additionalInstruction', 'После нажатия кнопки START в боте, вернитесь на эту страницу')}
        </p>
      </div>

      {/* Блок ошибок */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-2">
            <Icons.AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Кнопка "Назад" */}
      <div>
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="w-full bg-[var(--bg-active-button)] text-[var(--text-active-button)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {getText('telegramConnection.backButton', 'Назад')}
        </button>
      </div>

      {/* Индикатор проверки */}
      {checkingStatus && (
        <div className="mt-4 text-center">
          <p className="text-[var(--text-tertiary)] text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--text-tertiary)] border-t-transparent rounded-full animate-spin" />
            {getText('telegramConnection.checkingConnection', 'Проверка подключения...')}
          </p>
        </div>
      )}
    </div>
  )
}

export default TelegramConnectionForm

