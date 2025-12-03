'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

interface QuickActionsProps {
  teacherId: string
  onTabChange?: (tab: string) => void
}

const QuickActions: React.FC<QuickActionsProps> = ({ teacherId, onTabChange }) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const actions = [
    {
      icon: Icons.Plus,
      title: getText('quickActions.createTest', 'Создать тест'),
      description: getText('quickActions.createTestDesc', 'Создайте новый тест для ваших студентов'),
      action: () => {
        if (onTabChange) {
          onTabChange('tests')
        } else {
          router.push('/tests')
        }
      }
    },
    {
      icon: Icons.UserPlus,
      title: getText('quickActions.inviteStudent', 'Пригласить реферала'),
      description: getText('quickActions.inviteStudentDesc', 'Поделитесь реферальной ссылкой'),
      action: () => {
        if (onTabChange) {
          onTabChange('referrals')
        } else {
          router.push('/referrals')
        }
      }
    },
    {
      icon: Icons.Settings,
      title: getText('quickActions.profileSettings', 'Настройки профиля'),
      description: getText('quickActions.profileSettingsDesc', 'Измените настройки вашего профиля'),
      action: () => {
        if (onTabChange) {
          onTabChange('settings')
        } else {
          router.push('/settings')
        }
      }
    }
  ]

  if (!mounted || !ready) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-[var(--border-primary)] shadow-sm">
        <div className="h-5 sm:h-6 skeleton-shimmer rounded w-1/4 mb-3 sm:mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-[var(--bg-tertiary)]">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 skeleton-shimmer rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-1.5 sm:space-y-2">
                  <div className="h-3 sm:h-4 skeleton-shimmer rounded w-3/4"></div>
                  <div className="h-2.5 sm:h-3 skeleton-shimmer rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={action.action}
              className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl transition-all duration-300 text-left group relative overflow-hidden bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] active:scale-95"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 min-w-[2.25rem] sm:min-w-[2.5rem] flex-shrink-0 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0 text-[var(--text-primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm sm:text-sm md:text-base text-[var(--text-primary)] truncate">{action.title}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions

