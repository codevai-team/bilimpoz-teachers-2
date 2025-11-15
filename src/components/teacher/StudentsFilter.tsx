'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icons } from '@/components/ui/Icons'
import Select, { SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

interface StudentsFilterProps {
  search: string
  onSearchChange: (search: string) => void
  status: string
  onStatusChange: (status: string) => void
  sortBy: string
  onSortByChange: (sortBy: string) => void
  onClearFilters: () => void
}

const StudentsFilter: React.FC<StudentsFilterProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  onClearFilters
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const statusOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'all', label: t('students.filters.statusOptions.all') },
      { value: 'active', label: t('students.filters.statusOptions.active') },
      { value: 'inactive', label: t('students.filters.statusOptions.inactive') },
      { value: 'banned', label: t('students.filters.statusOptions.banned') },
    ]
  }, [t, mounted, ready])

  const sortOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'name', label: t('students.filters.sortOptions.name') },
      { value: 'registration_date', label: t('students.filters.sortOptions.registration_date') },
      { value: 'activity', label: t('students.filters.sortOptions.activity') },
      { value: 'lessons', label: t('students.filters.sortOptions.lessons') },
      { value: 'points', label: t('students.filters.sortOptions.points') },
    ]
  }, [t, mounted, ready])

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{getText('students.filters.title', 'Фильтры')}</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearFilters}
        >
          {getText('students.filters.clear', 'Очистить')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Поиск */}
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={getText('students.filters.searchPlaceholder', 'Поиск по имени...')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#242424] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 border-0"
          />
        </div>

        {/* Статус */}
        <Select
          value={status}
          onChange={onStatusChange}
          options={statusOptions}
          placeholder={getText('students.filters.statusPlaceholder', 'Выберите статус')}
        />

        {/* Сортировка */}
        <Select
          value={sortBy}
          onChange={onSortByChange}
          options={sortOptions}
          placeholder={getText('students.filters.sortPlaceholder', 'Сортировать по')}
        />
      </div>
    </div>
  )
}

export default StudentsFilter






