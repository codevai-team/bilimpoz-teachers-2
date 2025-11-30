'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

interface RecentActivityProps {
  teacherId: string
}

interface Activity {
  id: string
  type: string
  activityKey: string
  data: Record<string, any>
  timestamp: string
  icon: keyof typeof Icons
  color?: string
}

const RecentActivity: React.FC<RecentActivityProps> = ({ teacherId }) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !ready) return

    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/teacher/activity?teacherId=${teacherId}`)
        const data = await response.json()
        
        if (data.success) {
          setActivities(data.data || [])
        } else {
          setError(data.error || 'Ошибка загрузки активности')
        }
      } catch (err) {
        console.error('Error fetching activities:', err)
        setError('Ошибка загрузки активности')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [teacherId, mounted, ready])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) return getText('activity.time.justNow', 'Только что')
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${getText('activity.time.minutesAgo', 'минут назад')}`
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${getText('activity.time.hoursAgo', 'часов назад')}`
    }
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${getText('activity.time.daysAgo', 'дней назад')}`
  }

  // Берём только последние 5 действий
  const recentActivities = activities.slice(0, 5)

  if (!mounted || !ready || loading) {
    return (
      <div className="space-y-2 sm:space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 skeleton-shimmer rounded-xl flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 sm:h-5 skeleton-shimmer rounded w-1/2"></div>
                  <div className="h-3 skeleton-shimmer rounded w-16"></div>
                </div>
                <div className="h-3 sm:h-4 skeleton-shimmer rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && activities.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Icons.AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {activities.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--text-tertiary)]" />
          </div>
          <p className="text-sm sm:text-base font-medium text-[var(--text-primary)] mb-1">{getText('activity.noActivity', 'Нет активности')}</p>
          <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
            {getText('activity.noActivityDesc', 'Начните создавать тесты...')}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {recentActivities.map((activity) => {
            const Icon = Icons[activity.icon] || Icons.Activity
            const title = getText(`activity.${activity.activityKey}.title`, activity.type)
            const description = getText(`activity.${activity.activityKey}.description`, '')
            
            return (
              <div
                key={activity.id}
                className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Иконка */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-primary)]" />
                  </div>
                  
                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">{title}</p>
                      <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap flex-shrink-0">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    {description && (
                      <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-1 truncate">{description}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecentActivity

