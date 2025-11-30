'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

interface TeacherStatsProps {
  teacherId: string
}

interface StatsData {
  tests_added: number
  students_completed_tests: number
  referral_students: number
  total_platform_students: number
}

const TeacherStats: React.FC<TeacherStatsProps> = ({ teacherId }) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !ready) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/teacher/stats?teacherId=${teacherId}`)
        const data = await response.json()
        
        if (data.success) {
          setStats(data.data)
        } else {
          setError(data.error || 'Ошибка загрузки статистики')
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Ошибка загрузки статистики')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [teacherId, mounted, ready])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  if (!mounted || !ready || loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-tertiary)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 skeleton-shimmer rounded-xl mb-2 sm:mb-3"></div>
              <div className="h-6 sm:h-8 skeleton-shimmer rounded w-12 mb-1 sm:mb-2"></div>
              <div className="h-3 sm:h-4 skeleton-shimmer rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Icons.AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  const statCards = [
    {
      icon: Icons.BookOpen,
      value: stats?.tests_added || 0,
      title: getText('stats.testsAdded', 'Тесты добавлены'),
      description: getText('stats.testsAddedDesc', 'Всего созданных тестов')
    },
    {
      icon: Icons.Users,
      value: stats?.students_completed_tests || 0,
      title: getText('stats.studentsCompleted', 'Студенты прошли тесты'),
      description: getText('stats.studentsCompletedDesc', 'Студенты, прошедшие ваши тесты')
    },
    {
      icon: Icons.Share2,
      value: stats?.referral_students || 0,
      title: getText('stats.myReferrals', 'Мои рефералы'),
      description: getText('stats.myReferralsDesc', 'Студенты по вашей реферальной ссылке')
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-[var(--bg-tertiary)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 transition-all"
          >
            <div className="flex flex-col items-center text-center">
              {/* Иконка */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-card)] flex items-center justify-center mb-2 sm:mb-3">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--text-primary)]" />
              </div>
              
              {/* Число */}
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              
              {/* Название */}
              <h3 className="text-[10px] sm:text-xs md:text-sm font-medium text-[var(--text-tertiary)] leading-tight">
                {card.title}
              </h3>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TeacherStats

