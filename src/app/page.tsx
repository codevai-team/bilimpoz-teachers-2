'use client'

import React, { useState, useEffect } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import TeacherStats from '@/components/teacher/TeacherStats'
import QuickActions from '@/components/teacher/QuickActions'
import RecentActivity from '@/components/teacher/RecentActivity'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardSkeleton } from '@/components/ui/PageSkeletons'

export default function HomePage() {
  const { t, ready } = useTranslation()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* 1. Welcome Section */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm animate-slide-in-right">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
              <Icons.User className="w-6 h-6 text-[var(--text-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {getText('dashboard.welcome', 'Добро пожаловать')}, {user?.name || 'Пользователь'}!
              </h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {getText('dashboard.welcomeSubtitle', 'Начните создавать тесты и управлять учебным процессом')}
              </p>
            </div>
          </div>
        </div>

        {/* 2. TeacherStats - Статистика учителя */}
        <div>
          <TeacherStats teacherId={user?.id || ''} />
        </div>

        {/* 3. QuickActions - Быстрые действия */}
        <div>
          <QuickActions teacherId={user?.id || ''} />
        </div>

        {/* 4. RecentActivity - Последняя активность */}
        <div>
          <RecentActivity teacherId={user?.id || ''} />
        </div>
      </div>
    </TeacherLayout>
  )
}
