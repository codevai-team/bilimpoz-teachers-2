'use client'

import React from 'react'
import { Icons } from '@/components/ui/Icons'
import Select, { SelectOption } from '@/components/ui/Select'

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
  const questionTypeOptions: SelectOption[] = [
    { value: 'all', label: 'Все типы вопросов' },
    { value: 'math1', label: 'Математика 1' },
    { value: 'math2', label: 'Математика 2' },
    { value: 'analogy', label: 'Аналогия' },
    { value: 'rac', label: 'РАЦ' },
    { value: 'grammar', label: 'Грамматика' },
    { value: 'standard', label: 'Стандартный' },
  ]

  const sourceOptions: SelectOption[] = [
    { value: 'all', label: 'Все источники' },
    { value: 'from_lesson', label: 'Из урока' },
    { value: 'from_teacher', label: 'От преподавателя' },
    { value: 'from_trial', label: 'Из пробного теста' },
    { value: 'from_student', label: 'От ученика' },
    { value: 'from_mentor', label: 'От ментора' },
  ]

  const languageOptions: SelectOption[] = [
    { value: 'all', label: 'Все языки' },
    { value: 'ru', label: 'Русский' },
    { value: 'kg', label: 'Кыргызский' },
  ]

  const sortByOptions: SelectOption[] = [
    { value: 'created_at', label: 'По дате создания' },
    { value: 'updated_at', label: 'По дате обновления' },
    { value: 'question', label: 'По тексту вопроса' },
  ]

  const periodOptions = [
    { value: 'today', label: 'Сегодня' },
    { value: 'yesterday', label: 'Вчера' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
  ]

  return (
    <div className="bg-[#151515] rounded-2xl p-6 space-y-6">
      {/* Выпадающие фильтры */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          value={questionType}
          onChange={onQuestionTypeChange}
          options={questionTypeOptions}
          placeholder="Все типы вопросов"
        />
        <Select
          value={source}
          onChange={onSourceChange}
          options={sourceOptions}
          placeholder="Все источники"
        />
        <Select
          value={language}
          onChange={onLanguageChange}
          options={languageOptions}
          placeholder="Все языки"
        />
        <Select
          value={sortBy}
          onChange={onSortByChange}
          options={sortByOptions}
          placeholder="По дате создания"
        />
      </div>

      {/* Поиск по тексту вопроса */}
      <div className="relative">
        <Icons.Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск по тексту вопроса..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out"
        />
      </div>

      {/* Период */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Период:
        </label>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPeriodChange(option.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === option.value
                  ? 'bg-white text-black'
                  : 'bg-[#242424] text-gray-400 hover:text-white hover:bg-[#363636]'
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
          <label className="block text-sm font-medium text-gray-300 mb-3">
            От даты:
          </label>
          <div className="space-y-3">
            <div className="relative">
              <Icons.Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                placeholder="Выберите дату"
                className="w-full pl-12 pr-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out"
              />
            </div>
            <div className="relative">
              <Icons.Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => onTimeFromChange(e.target.value)}
                placeholder="Время"
                className="w-full pl-12 pr-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out"
              />
            </div>
          </div>
        </div>

        {/* До даты */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            До даты:
          </label>
          <div className="space-y-3">
            <div className="relative">
              <Icons.Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                placeholder="Выберите дату"
                className="w-full pl-12 pr-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out"
              />
            </div>
            <div className="relative">
              <Icons.Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={timeTo}
                onChange={(e) => onTimeToChange(e.target.value)}
                placeholder="Время"
                className="w-full pl-12 pr-4 py-3 bg-[#0b0b0b] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка очистки фильтров */}
      <div className="flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Очистить фильтры
        </button>
      </div>
    </div>
  )
}

export default QuestionsFilter
