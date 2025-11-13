'use client'

import React, { useState } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import StatCard from '@/components/teacher/StatCard'
import QuestionsFilter from '@/components/teacher/QuestionsFilter'
import QuestionCard from '@/components/teacher/QuestionCard'
import CreateQuestionModal, { QuestionFormData } from '@/components/teacher/CreateQuestionModal'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'

// Моковые данные вопросов (из базы данных Questions)
const mockQuestions = [
  {
    id: '1',
    question: 'Решите уравнение: 2x + 5 = 15',
    type_question: 'math1' as const,
    type_from: 'from_lesson' as const,
    language: 'ru' as const,
    created_at: '2024-11-12T10:30:00Z',
    hasComplaint: false,
    averageCorrect: 75.5,
  },
  {
    id: '2',
    question: 'Найдите производную функции f(x) = x² + 3x',
    type_question: 'math2' as const,
    type_from: 'from_teacher' as const,
    language: 'ru' as const,
    created_at: '2024-11-11T14:20:00Z',
    hasComplaint: true,
    averageCorrect: 63.2,
  },
  {
    id: '3',
    question: 'Выберите правильный вариант ответа',
    type_question: 'analogy' as const,
    type_from: 'from_trial' as const,
    language: 'kg' as const,
    created_at: '2024-11-10T09:15:00Z',
    hasComplaint: false,
    averageCorrect: 82.1,
  },
  {
    id: '4',
    question: 'Определите часть речи слова "красивый"',
    type_question: 'grammar' as const,
    type_from: 'from_student' as const,
    language: 'ru' as const,
    created_at: '2024-11-09T16:45:00Z',
    hasComplaint: true,
    averageCorrect: 45.8,
  },
]

export default function QuestionsPage() {
  const [questionType, setQuestionType] = useState('all')
  const [source, setSource] = useState('all')
  const [language, setLanguage] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('today')
  const [dateFrom, setDateFrom] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Статистика
  const stats = {
    total: mockQuestions.length,
    active: mockQuestions.filter(q => !q.hasComplaint).length,
    problematic: mockQuestions.filter(q => q.hasComplaint).length,
    averageCorrect: mockQuestions.length > 0
      ? (mockQuestions.reduce((sum, q) => sum + q.averageCorrect, 0) / mockQuestions.length).toFixed(1)
      : '0'
  }

  // Фильтрация вопросов
  const filteredQuestions = mockQuestions.filter(question => {
    const matchesType = questionType === 'all' || question.type_question === questionType
    const matchesSource = source === 'all' || question.type_from === source
    const matchesLanguage = language === 'all' || question.language === language
    const matchesSearch = question.question.toLowerCase().includes(search.toLowerCase())
    
    return matchesType && matchesSource && matchesLanguage && matchesSearch
  })

  // Сортировка
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'updated_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'question':
        return a.question.localeCompare(b.question)
      default:
        return 0
    }
  })

  const handleClearFilters = () => {
    setQuestionType('all')
    setSource('all')
    setLanguage('all')
    setSortBy('created_at')
    setSearch('')
    setPeriod('today')
    setDateFrom('')
    setTimeFrom('')
    setDateTo('')
    setTimeTo('')
  }

  const handleAnswer = (questionId: string) => {
    console.log('Ответить на вопрос:', questionId)
  }

  const handleMarkSolved = (questionId: string) => {
    console.log('Отметить как решенный:', questionId)
  }

  const handleMarkIncorrect = (questionId: string) => {
    console.log('Пометить как некорректный:', questionId)
  }

  const handleViewDetails = (questionId: string) => {
    console.log('Просмотр деталей вопроса:', questionId)
  }

  const handleCreateQuestion = async (data: QuestionFormData) => {
    setIsCreating(true)
    try {
      // TODO: Реализовать API запрос для создания вопроса
      console.log('Создание вопроса:', data)
      
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // После успешного создания закрываем модальное окно
      setIsCreateModalOpen(false)
      
      // TODO: Обновить список вопросов
    } catch (error) {
      console.error('Ошибка при создании вопроса:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white mb-2">
            Управление банком вопросов для уроков, тестов и дуэлей
          </h1>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Icons.Plus className="h-4 w-4 mr-2" />
            Создать вопрос
          </Button>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Всего вопросов"
            value={stats.total}
            icon={Icons.HelpCircle}
          />
          <StatCard
            title="Активные"
            value={stats.active}
            icon={Icons.CheckCircle}
          />
          <StatCard
            title="Проблемные"
            value={stats.problematic}
            icon={Icons.Flag}
          />
          <StatCard
            title="Средний % правильных"
            value={`${stats.averageCorrect}%`}
            icon={Icons.TrendingUp}
          />
        </div>

        {/* Фильтры */}
        <QuestionsFilter
          questionType={questionType}
          onQuestionTypeChange={setQuestionType}
          source={source}
          onSourceChange={setSource}
          language={language}
          onLanguageChange={setLanguage}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          search={search}
          onSearchChange={setSearch}
          period={period}
          onPeriodChange={setPeriod}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          timeFrom={timeFrom}
          onTimeFromChange={setTimeFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          timeTo={timeTo}
          onTimeToChange={setTimeTo}
          onClearFilters={handleClearFilters}
        />

        {/* Счетчик найденных вопросов */}
        <div className="text-sm text-gray-400">
          Найдено вопросов: {sortedQuestions.length}
        </div>

        {/* Список вопросов */}
        <div className="space-y-4">
          {sortedQuestions.length === 0 ? (
            <div className="bg-[#151515] rounded-2xl p-12 text-center">
              <Icons.HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Нет вопросов
              </h3>
              <p className="text-gray-400">
                По выбранным фильтрам вопросы не найдены
              </p>
            </div>
          ) : (
            sortedQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswer={handleAnswer}
                onMarkSolved={handleMarkSolved}
                onMarkIncorrect={handleMarkIncorrect}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </div>

        {/* Модальное окно создания вопроса */}
        <CreateQuestionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateQuestion}
          isLoading={isCreating}
        />
      </div>
    </TeacherLayout>
  )
}
