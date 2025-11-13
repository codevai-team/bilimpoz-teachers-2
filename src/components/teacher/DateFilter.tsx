'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'

interface DateFilterProps {
  onPeriodChange: (period: string) => void
  selectedPeriod: string
}

const DateFilter: React.FC<DateFilterProps> = ({
  onPeriodChange,
  selectedPeriod
}) => {
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [customTimeFrom, setCustomTimeFrom] = useState('')
  const [customTimeTo, setCustomTimeTo] = useState('')

  const quickFilters = [
    { value: 'today', label: 'Сегодня' },
    { value: 'yesterday', label: 'Вчера' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
  ]

  const handleQuickFilter = (period: string) => {
    onPeriodChange(period)
    setShowCustomRange(false)
  }

  const handleCustomApply = () => {
    // Здесь можно обработать кастомный диапазон
    onPeriodChange('custom')
    setShowCustomRange(false)
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Период</h3>
        <button
          onClick={() => setShowCustomRange(!showCustomRange)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Настроить
        </button>
      </div>

      {/* Быстрые фильтры */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleQuickFilter(filter.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedPeriod === filter.value
                ? 'bg-[#363636] text-white border border-white'
                : 'bg-[#242424] text-gray-400 border border-gray-700/50 hover:text-white hover:bg-[#363636]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Кастомный диапазон */}
      {showCustomRange && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                От даты
              </label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-[#242424] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                До даты
              </label>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-[#242424] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Время от
              </label>
              <input
                type="time"
                value={customTimeFrom}
                onChange={(e) => setCustomTimeFrom(e.target.value)}
                className="w-full px-3 py-2 bg-[#242424] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Время до
              </label>
              <input
                type="time"
                value={customTimeTo}
                onChange={(e) => setCustomTimeTo(e.target.value)}
                className="w-full px-3 py-2 bg-[#242424] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCustomApply}
            className="w-full"
          >
            Применить
          </Button>
        </div>
      )}
    </div>
  )
}

export default DateFilter



