'use client'

import React, { useState, useEffect } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import TeacherStats from '@/components/teacher/TeacherStats'
import QuickActions from '@/components/teacher/QuickActions'
import RecentActivity from '@/components/teacher/RecentActivity'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'

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
      <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 pb-12 sm:pb-14 lg:pb-0">
        {/* 1. TeacherStats - Статистика учителя */}
        <div>
          <TeacherStats teacherId={user?.id || ''} />
        </div>

        {/* 2. QuickActions - Быстрые действия */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
            {getText('quickActions.title', 'Быстрые действия')}
          </h1>
          <QuickActions teacherId={user?.id || ''} />
        </div>

        {/* 3. RecentActivity - Последняя активность */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
            {getText('activity.title', 'Последняя активность')}
          </h1>
          <RecentActivity teacherId={user?.id || ''} />
        </div>
      </div>
    </TeacherLayout>
  )
}
