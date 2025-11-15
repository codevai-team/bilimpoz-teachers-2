'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import CustomTimePicker from '@/components/ui/CustomTimePicker'
import { useTranslation } from '@/hooks/useTranslation'

interface DateFilterProps {
  onPeriodChange: (period: string) => void
  selectedPeriod: string
  onDateFromChange?: (date: string) => void
  onDateToChange?: (date: string) => void
  onTimeFromChange?: (time: string) => void
  onTimeToChange?: (time: string) => void
}

const DateFilter: React.FC<DateFilterProps> = ({
  onPeriodChange,
  selectedPeriod,
  onDateFromChange,
  onDateToChange,
  onTimeFromChange,
  onTimeToChange
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [customTimeFrom, setCustomTimeFrom] = useState('')
  const [customTimeTo, setCustomTimeTo] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const quickFilters = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'today', label: t('dashboard.today') },
      { value: 'yesterday', label: t('dashboard.yesterday') },
      { value: 'week', label: t('dashboard.week') },
      { value: 'month', label: t('dashboard.month') },
    ]
  }, [t, mounted, ready])

  // Функция для вычисления дат периода
  const getPeriodDates = (periodValue: string) => {
    const now = new Date()
    let fromDate = new Date()
    let toDate = new Date()

    switch (periodValue) {
      case 'today':
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        fromDate.setDate(now.getDate() - 1)
        fromDate.setHours(0, 0, 0, 0)
        toDate.setDate(now.getDate() - 1)
        toDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        // Последние 7 дней
        fromDate.setDate(now.getDate() - 6)
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)
        break
      case 'month':
        // Последние 30 дней
        fromDate.setDate(now.getDate() - 29)
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)
        break
      default:
        return { dateFrom: '', timeFrom: '', dateTo: '', timeTo: '' }
    }

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }

    return {
      dateFrom: formatDate(fromDate),
      timeFrom: formatTime(fromDate),
      dateTo: formatDate(toDate),
      timeTo: formatTime(toDate)
    }
  }

  const handleQuickFilter = (period: string) => {
    onPeriodChange(period)
    setShowCustomRange(false)
    
    // Автоматически устанавливаем даты для выбранного периода
    if (onDateFromChange && onDateToChange && onTimeFromChange && onTimeToChange) {
      const dates = getPeriodDates(period)
      onDateFromChange(dates.dateFrom)
      onTimeFromChange(dates.timeFrom)
      onDateToChange(dates.dateTo)
      onTimeToChange(dates.timeTo)
    }
  }

  const handleCustomApply = () => {
    // Здесь можно обработать кастомный диапазон
    onPeriodChange('custom')
    setShowCustomRange(false)
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{getText('dashboard.period', 'Период')}</h3>
        <button
          onClick={() => setShowCustomRange(!showCustomRange)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {getText('dashboard.configure', 'Настроить')}
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
                {getText('dashboard.fromDate', 'От даты')}
              </label>
              <CustomDatePicker
                value={customDateFrom}
                onChange={setCustomDateFrom}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('dashboard.toDate', 'До даты')}
              </label>
              <CustomDatePicker
                value={customDateTo}
                onChange={setCustomDateTo}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('dashboard.timeFrom', 'Время от')}
              </label>
              <CustomTimePicker
                value={customTimeFrom}
                onChange={setCustomTimeFrom}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('dashboard.timeTo', 'Время до')}
              </label>
              <CustomTimePicker
                value={customTimeTo}
                onChange={setCustomTimeTo}
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCustomApply}
            className="w-full"
          >
            {getText('common.apply', 'Применить')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default DateFilter




