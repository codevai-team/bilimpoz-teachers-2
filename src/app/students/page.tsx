'use client'

import React, { useState, useEffect } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import StatCard from '@/components/teacher/StatCard'
import StudentsFilter from '@/components/teacher/StudentsFilter'
import StudentCard from '@/components/teacher/StudentCard'
import ReferralSystem from '@/components/teacher/ReferralSystem'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

// Моковые данные учеников
const mockStudents = [
  {
    id: '1',
    name: 'Айжан Мамбетова',
    registrationDate: '2024-10-15T10:30:00Z',
    activity7Days: 12,
    completedLessons: 8,
    status: 'active' as const,
    points: 1250,
    profilePhotoUrl: undefined,
  },
  {
    id: '2',
    name: 'Бекжан Токтогулов',
    registrationDate: '2024-09-22T14:20:00Z',
    activity7Days: 5,
    completedLessons: 15,
    status: 'active' as const,
    points: 2100,
  },
  {
    id: '3',
    name: 'Гульнара Асанова',
    registrationDate: '2024-11-01T09:15:00Z',
    activity7Days: 0,
    completedLessons: 2,
    status: 'inactive' as const,
    points: 320,
  },
  {
    id: '4',
    name: 'Данияр Эсенов',
    registrationDate: '2024-08-10T16:45:00Z',
    activity7Days: 0,
    completedLessons: 25,
    status: 'banned' as const,
    points: 3200,
  },
  {
    id: '5',
    name: 'Элина Кадырова',
    registrationDate: '2024-11-05T11:30:00Z',
    activity7Days: 18,
    completedLessons: 6,
    status: 'active' as const,
    points: 890,
  },
]

export default function StudentsPage() {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [students, setStudents] = useState(mockStudents)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Реферальная система
  const referralData = {
    referralLink: 'https://bilimpoz.kg/ref/nasl_teacher_2024',
    totalClicks: 45,
    totalRegistrations: 12,
  }

  // Статистика
  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    inactive: students.filter(s => s.status === 'inactive').length,
    banned: students.filter(s => s.status === 'banned').length,
  }

  // Фильтрация и сортировка учеников
  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || student.status === status
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'registration_date':
          return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
        case 'activity':
          return b.activity7Days - a.activity7Days
        case 'lessons':
          return b.completedLessons - a.completedLessons
        case 'points':
          return b.points - a.points
        default:
          return 0
      }
    })

  const handleClearFilters = () => {
    setSearch('')
    setStatus('all')
    setSortBy('name')
  }

  const handleViewDetails = (studentId: string) => {
    console.log('Просмотр деталей ученика:', studentId)
    // Здесь можно открыть модальное окно с деталями
  }

  const handleBlockStudent = (studentId: string) => {
    if (confirm(t('students.confirmations.blockStudent'))) {
      setStudents(prev =>
        prev.map(s =>
          s.id === studentId
            ? { ...s, status: 'banned' as const }
            : s
        )
      )
    }
  }

  const handleUnblockStudent = (studentId: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? { ...s, status: 'active' as const }
          : s
      )
    )
  }

  const handleDeleteStudent = (studentId: string) => {
    if (confirm(t('students.confirmations.deleteStudent'))) {
      setStudents(prev => prev.filter(s => s.id !== studentId))
    }
  }

  const handleCopyLink = () => {
    console.log('Ссылка скопирована в буфер обмена')
    // Здесь можно показать toast уведомление
  }

  const handleInviteStudent = () => {
    console.log('Открыть модальное окно приглашения ученика')
    // Здесь можно открыть модальное окно для приглашения
  }

  // Предотвращаем ошибки гидратации, пока i18n не готов
  if (!mounted || !ready) {
    return (
      <TeacherLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Ученики</h1>
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
            {t('students.title')}
          </h1>
          <p className="text-gray-400">
            {t('students.description')}
          </p>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('students.stats.total')}
            value={stats.total}
            icon={Icons.Users}
          />
          <StatCard
            title={t('students.stats.active')}
            value={stats.active}
            icon={Icons.UserCheck}
            onClick={() => setStatus('active')}
          />
          <StatCard
            title={t('students.stats.inactive')}
            value={stats.inactive}
            icon={Icons.UserX}
            onClick={() => setStatus('inactive')}
          />
          <StatCard
            title={t('students.stats.banned')}
            value={stats.banned}
            icon={Icons.UserMinus}
            onClick={() => setStatus('banned')}
          />
        </div>

        {/* Реферальная система */}
        <ReferralSystem
          referralLink={referralData.referralLink}
          totalClicks={referralData.totalClicks}
          totalRegistrations={referralData.totalRegistrations}
          onCopyLink={handleCopyLink}
          onInviteStudent={handleInviteStudent}
        />

        {/* Фильтры */}
        <StudentsFilter
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onClearFilters={handleClearFilters}
        />

        {/* Список учеников */}
        <div className="space-y-4">
          {filteredAndSortedStudents.length === 0 ? (
            <div className="bg-[#151515] rounded-2xl p-12 text-center">
              <Icons.Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {t('students.empty.title')}
              </h3>
              <p className="text-gray-400 mb-4">
                {search || status !== 'all' 
                  ? t('students.empty.noResults')
                  : t('students.empty.noStudents')
                }
              </p>
              {!search && status === 'all' && (
                <button
                  onClick={handleInviteStudent}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  <Icons.Plus className="h-4 w-4" />
                  {t('students.empty.inviteButton')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Пагинация (заглушка) */}
        {filteredAndSortedStudents.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-[#151515] rounded-2xl">
            <span className="text-sm text-gray-400">
              {t('students.pagination.showing')} 1-{filteredAndSortedStudents.length} {t('students.pagination.of')} {filteredAndSortedStudents.length}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled 
                className="px-3 py-2 bg-[#242424] rounded-lg text-gray-400 opacity-50 cursor-not-allowed"
              >
                {t('students.pagination.previous')}
              </button>
              <button className="px-3 py-2 bg-white text-black rounded-lg font-medium">
                1
              </button>
              <button 
                disabled 
                className="px-3 py-2 bg-[#242424] rounded-lg text-gray-400 opacity-50 cursor-not-allowed"
              >
                {t('students.pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

