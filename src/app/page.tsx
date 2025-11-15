'use client'

import React, { useState, useEffect } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import StatCard from '@/components/teacher/StatCard'
import DateFilter from '@/components/teacher/DateFilter'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

export default function HomePage() {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Моковые данные статистики
  const stats = {
    activeStudents: 40,
    conductedLessons: 1,
    newQuestions: 4,
    blockedUsers: 2,
    totalPoints: 1250,
    monthGrowth: '+15%'
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    // Здесь можно загрузить данные для выбранного периода
  }

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  // Предотвращаем ошибки гидратации, пока i18n не готов
  if (!mounted || !ready) {
    return (
      <TeacherLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Главная</h1>
            <p className="text-gray-400">Загрузка...</p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-400">
            {t('dashboard.description')}
          </p>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.stats.total')}
            value={stats.activeStudents}
            icon={Icons.Users}
          />
          <StatCard
            title={t('dashboard.stats.active')}
            value={stats.conductedLessons}
            icon={Icons.TrendingUp}
          />
          <StatCard
            title={t('dashboard.stats.new')}
            value={stats.newQuestions}
            icon={Icons.User}
          />
          <StatCard
            title={t('dashboard.stats.blocked')}
            value={stats.blockedUsers}
            icon={Icons.XCircle}
          />
        </div>

        {/* Фильтр по периоду и дополнительная статистика */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Фильтр по датам */}
          <div className="lg:col-span-1">
            <DateFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
          </div>

          {/* Дополнительная статистика */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title={t('dashboard.stats.conductedLessons')}
              value={stats.conductedLessons}
              icon={Icons.BookOpen}
              onClick={() => console.log('Переход к урокам')}
            />
            <StatCard
              title={t('dashboard.stats.newQuestions')}
              value={stats.newQuestions}
              icon={Icons.HelpCircle}
              onClick={() => console.log('Переход к вопросам')}
            />
            <StatCard
              title={t('dashboard.stats.totalPoints')}
              value={stats.totalPoints}
              icon={Icons.Award}
            />
            <StatCard
              title={t('dashboard.stats.monthGrowth')}
              value={stats.monthGrowth}
              icon={Icons.TrendingUp}
            />
          </div>
        </div>

        {/* График активности (заглушка) */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              {t('dashboard.activityChart')}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Icons.TrendingUp className="h-4 w-4" />
              <span>{t('dashboard.last7Days')}</span>
            </div>
          </div>
          
          {/* Заглушка для графика */}
          <div className="h-64 bg-[#242424] rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Icons.BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">{t('dashboard.activityChart')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('dashboard.chartLoading')}</p>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {t('dashboard.quickActions')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors group">
              <div className="p-2 bg-[#363636] rounded-lg group-hover:bg-[#4a4a4a]">
                <Icons.HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">{t('dashboard.newQuestionsAction')}</p>
                <p className="text-sm text-gray-400">{t('dashboard.newQuestionsActionDesc')}</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors group">
              <div className="p-2 bg-[#363636] rounded-lg group-hover:bg-[#4a4a4a]">
                <Icons.MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">{t('dashboard.discussionsAction')}</p>
                <p className="text-sm text-gray-400">{t('dashboard.discussionsActionDesc')}</p>
              </div>
            </button>

            <button 
              onClick={() => window.location.href = '/students'}
              className="flex items-center gap-3 p-4 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors group"
            >
              <div className="p-2 bg-[#363636] rounded-lg group-hover:bg-[#4a4a4a]">
                <Icons.Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white">{t('dashboard.studentsAction')}</p>
                <p className="text-sm text-gray-400">{t('dashboard.studentsActionDesc')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}
