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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-tertiary)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 skeleton-shimmer rounded-lg"></div>
              <div className="h-4 skeleton-shimmer rounded w-3/4"></div>
          </div>
            <div className="h-8 skeleton-shimmer rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-primary)] shadow-sm">
        <p className="text-red-500 dark:text-red-400">{error}</p>
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
    },
    {
      icon: Icons.Globe,
      value: stats?.total_platform_students || 0,
      title: getText('stats.totalStudents', 'Всего студентов'),
      description: getText('stats.totalStudentsDesc', 'Всего студентов на платформе')
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-[var(--bg-tertiary)] rounded-2xl p-6 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--bg-card)] rounded-lg">
                <Icon className="h-6 w-6 text-[var(--text-primary)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </p>
            <h3 className="text-sm font-medium text-[var(--text-tertiary)]">
              {card.title}
            </h3>
          </div>
        )
      })}
    </div>
  )
}

export default TeacherStats

