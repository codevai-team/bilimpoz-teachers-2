'use client'

import React from 'react'
import { Icons } from '@/components/ui/Icons'
import Select, { SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'

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
  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'inactive', label: 'Неактивные' },
    { value: 'banned', label: 'Заблокированные' },
  ]

  const sortOptions: SelectOption[] = [
    { value: 'name', label: 'По имени' },
    { value: 'registration_date', label: 'По дате регистрации' },
    { value: 'activity', label: 'По активности' },
    { value: 'lessons', label: 'По урокам' },
    { value: 'points', label: 'По баллам' },
  ]

  return (
    <div className="bg-[#151515] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Фильтры</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearFilters}
        >
          Очистить
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Поиск */}
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени..."
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
          placeholder="Выберите статус"
        />

        {/* Сортировка */}
        <Select
          value={sortBy}
          onChange={onSortByChange}
          options={sortOptions}
          placeholder="Сортировать по"
        />
      </div>
    </div>
  )
}

export default StudentsFilter



