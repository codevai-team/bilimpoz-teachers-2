'use client'

import React from 'react'

/**
 * Базовый компонент Skeleton с shimmer анимацией
 * Автоматически адаптируется к теме (темная/светлая)
 */
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  rounded = false
}) => {
  const baseClasses = 'skeleton-shimmer'
  
  const variantClasses = {
    text: 'rounded-lg',
    circular: 'rounded-full',
    rectangular: rounded ? 'rounded-2xl' : 'rounded-lg',
    rounded: 'rounded-2xl'
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton для текстовых строк
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton для аватара
 */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ 
  size = 48, 
  className = '' 
}) => {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  )
}

/**
 * Skeleton для карточки статистики
 */
export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--bg-tertiary)] rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="rectangular" width={40} height={40} rounded />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
      <Skeleton variant="text" width="40%" height={32} />
    </div>
  )
}

/**
 * Skeleton для карточки студента
 */
export const SkeletonStudentCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--bg-card)] rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between gap-6">
        {/* Левая часть: Аватар и информация */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <SkeletonAvatar size={48} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" width={80} height={20} rounded />
            </div>
            <Skeleton variant="text" width="60%" height={14} />
          </div>
        </div>
        
        {/* Центральная часть: Статистика (скрыта на мобильных) */}
        <div className="hidden md:flex items-center gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center min-w-[80px]">
              <Skeleton variant="text" width={40} height={24} className="mx-auto mb-1" />
              <Skeleton variant="text" width={60} height={12} className="mx-auto" />
            </div>
          ))}
        </div>
        
        {/* Правая часть: Действия */}
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={36} height={36} rounded />
        </div>
      </div>
      
      {/* Мобильная версия статистики */}
      <div className="md:hidden mt-4 pt-4 border-t border-[var(--border-primary)]">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton variant="text" width={40} height={24} className="mx-auto mb-1" />
              <Skeleton variant="text" width={60} height={12} className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton для карточки вопроса
 */
export const SkeletonQuestionCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--bg-card)] rounded-2xl p-6 ${className}`}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          {/* Теги */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={80} height={24} rounded />
            ))}
          </div>
          
          {/* Текст вопроса */}
          <div className="space-y-2 mb-3">
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="85%" height={20} />
          </div>
          
          {/* Метаданные */}
          <div className="flex items-center gap-4">
            <Skeleton variant="text" width={100} height={16} />
            <Skeleton variant="text" width={150} height={16} />
          </div>
        </div>
        
        {/* Действия */}
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={36} height={36} rounded />
          <Skeleton variant="rectangular" width={36} height={36} rounded />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton для таблицы вопросов
 */
export const SkeletonQuestionsTable: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--bg-card)] rounded-2xl overflow-hidden ${className}`}>
      {/* Заголовок */}
      <div className="p-6 border-b border-[var(--border-primary)]">
        <Skeleton variant="text" width="25%" height={24} />
      </div>
      
      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)]">
            <tr>
              {[...Array(6)].map((_, i) => (
                <th key={i} className="py-3 px-6">
                  <Skeleton variant="text" width={100} height={16} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[var(--border-primary)]/50">
                {[...Array(6)].map((_, colIndex) => (
                  <td key={colIndex} className="py-4 px-6">
                    {colIndex === 0 ? (
                      <div className="space-y-2">
                        <Skeleton variant="text" width="100%" height={16} />
                        <Skeleton variant="text" width="60%" height={14} />
                      </div>
                    ) : colIndex === 5 ? (
                      <div className="flex items-center gap-2">
                        <Skeleton variant="rectangular" width={32} height={32} rounded />
                        <Skeleton variant="rectangular" width={32} height={32} rounded />
                      </div>
                    ) : (
                      <Skeleton variant="rectangular" width={100} height={32} rounded />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Skeleton для Dashboard страницы
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <Skeleton variant="rectangular" width={48} height={48} rounded />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="50%" height={24} />
            <Skeleton variant="text" width="70%" height={16} />
          </div>
        </div>
      </div>

      {/* TeacherStats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* QuickActions */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm">
        <div className="pb-2 border-b border-[var(--border-primary)] mb-6">
          <Skeleton variant="text" width="25%" height={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <div className="flex items-center space-x-3">
                <Skeleton variant="rectangular" width={40} height={40} rounded />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="70%" height={18} />
                  <Skeleton variant="text" width="90%" height={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RecentActivity */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 shadow-sm">
        <div className="pb-2 border-b border-[var(--border-primary)] mb-6">
          <Skeleton variant="text" width="30%" height={24} />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton variant="rectangular" width={40} height={40} rounded />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="75%" height={16} />
                <Skeleton variant="text" width="50%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton для страницы Students/Referrals
 */
export const StudentsPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Заголовок страницы */}
      <div>
        <Skeleton variant="text" width="40%" height={28} className="mb-2" />
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-tertiary)] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <Skeleton variant="rectangular" width={40} height={40} rounded className="mb-2 sm:mb-3" />
              <Skeleton variant="text" width={40} height={24} className="mb-1 sm:mb-2" />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
          </div>
        ))}
      </div>

      {/* Реферальная система - заголовок */}
      <Skeleton variant="text" width="50%" height={24} className="mb-2" />
      
      {/* Реферальная система - блок */}
      <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <Skeleton variant="text" width="40%" height={18} />
            <Skeleton variant="text" width={120} height={14} />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-[var(--bg-card)] rounded-lg px-4 py-3 border border-[var(--border-primary)]">
              <Skeleton variant="text" width="100%" height={16} />
            </div>
            <Skeleton variant="rectangular" width={120} height={40} rounded className="flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Способы приглашения - заголовок */}
      <Skeleton variant="text" width="45%" height={24} className="mb-2" />
      
      {/* Способы приглашения - блок */}
      <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <Skeleton variant="rectangular" width={36} height={36} rounded />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="50%" height={14} />
                <Skeleton variant="text" width="70%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Фильтры - заголовок */}
      <Skeleton variant="text" width="25%" height={24} className="mb-2" />
      
      {/* Фильтры - блок */}
      <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton variant="rectangular" width="100%" height={40} rounded className="flex-1" />
          <Skeleton variant="rectangular" width="100%" height={40} rounded className="flex-1" />
          <Skeleton variant="rectangular" width={100} height={40} rounded className="flex-shrink-0" />
        </div>
      </div>

      {/* Мои рефералы - заголовок */}
      <Skeleton variant="text" width="35%" height={24} className="mb-2" />

      {/* Список рефералов */}
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton variant="text" width="40%" height={18} />
                  <Skeleton variant="rectangular" width={80} height={20} rounded />
                </div>
                <Skeleton variant="text" width="30%" height={14} />
              </div>
            </div>
            {/* Мобильная статистика */}
            <div className="md:hidden mt-4 pt-4 border-t border-[var(--border-primary)]">
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="text-center">
                    <Skeleton variant="text" width={30} height={20} className="mx-auto mb-1" />
                    <Skeleton variant="text" width={50} height={12} className="mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-center gap-2 pb-4">
        <Skeleton variant="rectangular" width={70} height={36} rounded />
        <Skeleton variant="rectangular" width={36} height={36} rounded />
        <Skeleton variant="rectangular" width={70} height={36} rounded />
      </div>
    </div>
  )
}

/**
 * Skeleton для страницы Questions
 */
export const QuestionsPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="25%" height={32} />
        <Skeleton variant="rectangular" width={180} height={40} rounded />
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Фильтры */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6">
        <div className="space-y-4">
          <Skeleton variant="text" width="20%" height={20} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={40} rounded />
            ))}
          </div>
        </div>
      </div>

      {/* Таблица вопросов */}
      <SkeletonQuestionsTable />
    </div>
  )
}

/**
 * Skeleton для карточки теста
 */
export const SkeletonTestCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-primary)] ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton variant="text" width="70%" height={24} className="mb-2" />
          <Skeleton variant="text" width="100%" height={16} className="mb-1" />
          <Skeleton variant="text" width="80%" height={16} />
        </div>
        <Skeleton variant="rectangular" width={36} height={36} rounded />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width={80} height={16} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width={100} height={16} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton variant="rectangular" width={80} height={20} rounded />
        <Skeleton variant="text" width={100} height={14} />
      </div>
    </div>
  )
}

/**
 * Skeleton для страницы Tests
 */
export const TestsPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton variant="text" width="25%" height={32} className="mb-2" />
          <Skeleton variant="text" width="50%" height={20} />
        </div>
        <Skeleton variant="rectangular" width={180} height={40} rounded />
      </div>

      {/* Фильтры */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Поиск */}
          <div>
            <Skeleton variant="text" width="30%" height={16} className="mb-2" />
            <Skeleton variant="rectangular" width="100%" height={40} rounded />
          </div>
          {/* Язык */}
          <div>
            <Skeleton variant="text" width="30%" height={16} className="mb-2" />
            <Skeleton variant="rectangular" width="100%" height={40} rounded />
          </div>
          {/* Статус */}
          <div>
            <Skeleton variant="text" width="30%" height={16} className="mb-2" />
            <Skeleton variant="rectangular" width="100%" height={40} rounded />
          </div>
        </div>

        {/* Период */}
        <div>
          <Skeleton variant="text" width="20%" height={16} className="mb-3" />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width={100} height={36} rounded />
            ))}
          </div>
        </div>

        {/* Диапазон дат */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i}>
              <Skeleton variant="text" width="30%" height={16} className="mb-3" />
              <div className="space-y-3">
                <Skeleton variant="rectangular" width="100%" height={40} rounded />
                <Skeleton variant="rectangular" width="100%" height={40} rounded />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Список тестов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonTestCard key={i} />
        ))}
      </div>
    </div>
  )
}


