'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import Tooltip from '@/components/ui/Tooltip'
import { useTranslation } from '@/hooks/useTranslation'

interface Student {
  id: string
  name: string
  registrationDate: string
  activity7Days: number
  completedLessons: number
  status: 'active' | 'inactive' | 'banned'
  points: number
  profilePhotoUrl?: string
}

interface StudentCardProps {
  student: Student
  onViewDetails: (studentId: string) => void
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onViewDetails
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const getStatusConfig = (status: Student['status']) => {
    if (!mounted || !ready) {
      // Fallback значения до готовности переводов
      switch (status) {
        case 'active':
          return {
            label: 'Активен',
            bgColor: 'bg-green-500/10',
            textColor: 'text-green-400',
            borderColor: 'border-green-500/20'
          }
        case 'inactive':
          return {
            label: 'Неактивен',
            bgColor: 'bg-yellow-500/10',
            textColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/20'
          }
        case 'banned':
          return {
            label: 'Заблокирован',
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400',
            borderColor: 'border-red-500/20'
          }
        default:
          return {
            label: 'Неизвестно',
            bgColor: 'bg-gray-500/10',
            textColor: 'text-gray-400',
            borderColor: 'border-gray-500/20'
          }
      }
    }
    switch (status) {
      case 'active':
        return {
          label: t('students.card.status.active'),
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/20'
        }
      case 'inactive':
        return {
          label: t('students.card.status.inactive'),
          bgColor: 'bg-yellow-500/10',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-500/20'
        }
      case 'banned':
        return {
          label: t('students.card.status.banned'),
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/20'
        }
      default:
        return {
          label: t('students.card.status.unknown'),
          bgColor: 'bg-gray-500/10',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500/20'
        }
    }
  }

  const statusConfig = getStatusConfig(student.status)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6 hover:bg-[#1a1a1a] transition-colors">
      <div className="flex items-center justify-between gap-6">
        {/* Левая часть: Аватар и основная информация */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Аватар */}
          <div className="w-12 h-12 bg-[#363636] rounded-full flex items-center justify-center flex-shrink-0">
            {student.profilePhotoUrl ? (
              <img 
                src={student.profilePhotoUrl} 
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <Icons.User className="h-6 w-6 text-white" />
            )}
          </div>
          
          {/* Имя и дата регистрации */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-white truncate">{student.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor} flex-shrink-0`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {getText('students.card.registration', 'Регистрация:')} {formatDate(student.registrationDate)}
            </p>
          </div>
        </div>

        {/* Центральная часть: Статистика */}
        <div className="hidden md:flex items-center gap-6 flex-shrink-0">
          <div className="text-center min-w-[80px]">
            <p className="text-lg font-bold text-white">{student.activity7Days}</p>
            <p className="text-xs text-gray-400">{getText('students.card.activity7Days', 'Активность (7 дней)')}</p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-lg font-bold text-white">{student.completedLessons}</p>
            <p className="text-xs text-gray-400">{getText('students.card.lessons', 'Уроков')}</p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-lg font-bold text-white">{student.points.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{getText('students.card.points', 'Баллы')}</p>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="flex items-center justify-center gap-1">
              <Icons.TrendingUp className="h-4 w-4 text-green-400" />
              <p className="text-sm font-medium text-green-400">+12%</p>
            </div>
            <p className="text-xs text-gray-400">{getText('students.card.growth', 'Рост')}</p>
          </div>
        </div>

        {/* Правая часть: Действия */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip text={getText('students.card.details', 'Детали')}>
            <button
              onClick={() => onViewDetails(student.id)}
              className="p-2 rounded-lg bg-[#242424] hover:bg-[#2a2a2a] transition-colors"
            >
              <Icons.Eye className="h-5 w-5 text-white" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Мобильная версия статистики */}
      <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{student.activity7Days}</p>
            <p className="text-xs text-gray-400">{getText('students.card.activity7Days', 'Активность (7 дней)')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{student.completedLessons}</p>
            <p className="text-xs text-gray-400">{getText('students.card.completedLessons', 'Пройдено уроков')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{student.points.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{getText('students.card.points', 'Баллы')}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Icons.TrendingUp className="h-4 w-4 text-green-400" />
              <p className="text-sm font-medium text-green-400">+12%</p>
            </div>
            <p className="text-xs text-gray-400">{getText('students.card.growthWeek', 'Рост за неделю')}</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default StudentCard

