'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icons } from '@/components/ui/Icons'
import Select, { SelectOption } from '@/components/ui/Select'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import CustomTimePicker from '@/components/ui/CustomTimePicker'
import { useTranslation } from '@/hooks/useTranslation'

interface QuestionsFilterProps {
  questionType: string
  onQuestionTypeChange: (type: string) => void
  source: string
  onSourceChange: (source: string) => void
  language: string
  onLanguageChange: (language: string) => void
  sortBy: string
  onSortByChange: (sortBy: string) => void
  search: string
  onSearchChange: (search: string) => void
  period: string
  onPeriodChange: (period: string) => void
  dateFrom: string
  onDateFromChange: (date: string) => void
  timeFrom: string
  onTimeFromChange: (time: string) => void
  dateTo: string
  onDateToChange: (date: string) => void
  timeTo: string
  onTimeToChange: (time: string) => void
  onClearFilters: () => void
}

const QuestionsFilter: React.FC<QuestionsFilterProps> = ({
  questionType,
  onQuestionTypeChange,
  source,
  onSourceChange,
  language,
  onLanguageChange,
  sortBy,
  onSortByChange,
  search,
  onSearchChange,
  period,
  onPeriodChange,
  dateFrom,
  onDateFromChange,
  timeFrom,
  onTimeFromChange,
  dateTo,
  onDateToChange,
  timeTo,
  onTimeToChange,
  onClearFilters
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const questionTypeOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'all', label: t('questions.questionTypes.all') },
      { value: 'math1', label: t('questions.questionTypes.math1') },
      { value: 'math2', label: t('questions.questionTypes.math2') },
      { value: 'analogy', label: t('questions.questionTypes.analogy') },
      { value: 'rac', label: t('questions.questionTypes.rac') },
      { value: 'grammar', label: t('questions.questionTypes.grammar') },
      { value: 'standard', label: t('questions.questionTypes.standard') },
  ]
  }, [t, mounted, ready])

  const sourceOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'all', label: t('questions.sources.all') },
      { value: 'from_lesson', label: t('questions.sources.from_lesson') },
      { value: 'from_teacher', label: t('questions.sources.from_teacher') },
      { value: 'from_trial', label: t('questions.sources.from_trial') },
      { value: 'from_student', label: t('questions.sources.from_student') },
      { value: 'from_mentor', label: t('questions.sources.from_mentor') },
  ]
  }, [t, mounted, ready])

  const languageOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'all', label: t('questions.languages.all') },
      { value: 'ru', label: t('questions.languages.ru') },
      { value: 'kg', label: t('questions.languages.kg') },
  ]
  }, [t, mounted, ready])

  const sortByOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'created_at', label: t('questions.sortOptions.created_at') },
      { value: 'updated_at', label: t('questions.sortOptions.updated_at') },
      { value: 'question', label: t('questions.sortOptions.question') },
  ]
  }, [t, mounted, ready])

  const periodOptions = useMemo(() => {
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
        // Текущий месяц: от 1 числа до конца месяца
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
        fromDate.setHours(0, 0, 0, 0)
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
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

  // Обработчик изменения периода
  const handlePeriodChange = (newPeriod: string) => {
    onPeriodChange(newPeriod)
    
    // Автоматически устанавливаем даты для выбранного периода
    if (newPeriod !== 'all' && newPeriod !== 'custom') {
      const dates = getPeriodDates(newPeriod)
      onDateFromChange(dates.dateFrom)
      onTimeFromChange(dates.timeFrom)
      onDateToChange(dates.dateTo)
      onTimeToChange(dates.timeTo)
    }
  }

  // Проверка, применены ли какие-либо фильтры
  const hasActiveFilters = useMemo(() => {
    return (
      questionType !== 'all' ||
      source !== 'all' ||
      language !== 'all' ||
      sortBy !== 'created_at' ||
      search.trim() !== '' ||
      period !== '' ||
      dateFrom !== '' ||
      dateTo !== '' ||
      timeFrom !== '' ||
      timeTo !== ''
    )
  }, [questionType, source, language, sortBy, search, period, dateFrom, dateTo, timeFrom, timeTo])

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-6 space-y-6 shadow-sm ">
      {/* Заголовок секции фильтров */}
      

      {/* Выпадающие фильтры */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          value={questionType}
          onChange={onQuestionTypeChange}
          options={questionTypeOptions}
          placeholder={getText('questions.questionTypes.all', 'Все типы вопросов')}
        />
        <Select
          value={source}
          onChange={onSourceChange}
          options={sourceOptions}
          placeholder={getText('questions.sources.all', 'Все источники')}
        />
        <Select
          value={language}
          onChange={onLanguageChange}
          options={languageOptions}
          placeholder={getText('questions.languages.all', 'Все языки')}
        />
        <Select
          value={sortBy}
          onChange={onSortByChange}
          options={sortByOptions}
          placeholder={getText('questions.sortOptions.created_at', 'По дате создания')}
        />
      </div>

      {/* Поиск по тексту вопроса */}
      <div className="relative">
        <Icons.Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder={getText('common.search', 'Поиск...')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[var(--bg-select)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all duration-300 ease-in-out"
        />
      </div>

      {/* Период */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          {getText('questions.period', 'Период')}:
        </label>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === option.value
                  ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-select)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Диапазон дат */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* От даты */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            {getText('questions.fromDate', 'От даты')}:
          </label>
          <div className="space-y-3">
            <CustomDatePicker
              value={dateFrom}
              onChange={onDateFromChange}
            />
            <CustomTimePicker
              value={timeFrom}
              onChange={onTimeFromChange}
            />
          </div>
        </div>

        {/* До даты */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
            {getText('questions.toDate', 'До даты')}:
          </label>
          <div className="space-y-3">
            <CustomDatePicker
              value={dateTo}
              onChange={onDateToChange}
            />
            <CustomTimePicker
              value={timeTo}
              onChange={onTimeToChange}
            />
          </div>
        </div>
      </div>

      {/* Кнопка очистки фильтров - показывается только при наличии активных фильтров */}
      {hasActiveFilters && (
      <div className="flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {getText('questions.clearFilters', 'Очистить фильтры')}
        </button>
      </div>
      )}
    </div>
  )
}

export default QuestionsFilter
