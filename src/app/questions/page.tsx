'use client'

import React, { useState, useEffect } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import StatCard from '@/components/teacher/StatCard'
import QuestionsFilter from '@/components/teacher/QuestionsFilter'
import QuestionsTable from '@/components/teacher/QuestionsTable'
import CreateQuestionModal, { QuestionFormData } from '@/components/teacher/CreateQuestionModal'
import QuestionDetailsModal from '@/components/teacher/QuestionDetailsModal'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import { QuestionsPageSkeleton } from '@/components/ui/PageSkeletons'

interface Question {
  id: string
  question: string
  type_question: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'
  type_from: 'from_lesson' | 'from_teacher' | 'from_trial' | 'from_student' | 'from_mentor'
  language: 'ru' | 'kg'
  created_at: string
  hasComplaint?: boolean
  averageCorrect?: number
  photo_url?: string
  answer_variants?: Array<{ value: string }>
  correct_variant_index?: number
}

export default function QuestionsPage() {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [questionType, setQuestionType] = useState('all')
  const [source, setSource] = useState('all')
  const [language, setLanguage] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editingQuestionData, setEditingQuestionData] = useState<QuestionFormData | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null)

  // Загрузка вопросов из API
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/teacher/questions')
        const result = await response.json()
        
        if (result.success && result.data) {
          setQuestions(result.data)
        } else {
          console.error('Ошибка загрузки вопросов:', result.error)
          setQuestions([])
        }
      } catch (error) {
        console.error('Ошибка при загрузке вопросов:', error)
        setQuestions([])
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      fetchQuestions()
    }
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Статистика
  const stats = {
    total: questions.length,
    active: questions.filter(q => !q.hasComplaint).length,
    problematic: questions.filter(q => q.hasComplaint).length,
    averageCorrect: questions.length > 0
      ? (questions.reduce((sum, q) => sum + (q.averageCorrect || 0), 0) / questions.length).toFixed(1)
      : '0'
  }

  // Фильтрация вопросов
  const filteredQuestions = questions.filter(question => {
    const matchesType = questionType === 'all' || question.type_question === questionType
    const matchesSource = source === 'all' || question.type_from === source
    const matchesLanguage = language === 'all' || question.language === language
    const matchesSearch = question.question.toLowerCase().includes(search.toLowerCase())
    
    // Фильтрация по дате и времени
    let matchesDate = true
    // Фильтруем только если указана хотя бы одна дата
    if (dateFrom || dateTo) {
      const questionDate = new Date(question.created_at)
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        if (timeFrom) {
          const [hours, minutes] = timeFrom.split(':')
          fromDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
        } else {
          fromDate.setHours(0, 0, 0, 0)
        }
        if (questionDate < fromDate) {
          matchesDate = false
        }
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo)
        if (timeTo) {
          const [hours, minutes] = timeTo.split(':')
          toDate.setHours(parseInt(hours) || 23, parseInt(minutes) || 59, 59, 999)
        } else {
          toDate.setHours(23, 59, 59, 999)
        }
        if (questionDate > toDate) {
          matchesDate = false
        }
      }
    }
    
    return matchesType && matchesSource && matchesLanguage && matchesSearch && matchesDate
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
    setPeriod('')
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

  const handleViewDetails = (question: Question) => {
    setViewingQuestion(question)
    setIsDetailsModalOpen(true)
  }

  const handleEdit = (question: Question) => {
    const foundQuestion = questions.find(q => q.id === question.id)
    if (foundQuestion) {
      // Преобразуем данные вопроса в формат формы
      // Для редактирования нужно загрузить полные данные вопроса с вариантами ответов
      // Пока используем базовые данные
      const questionData: QuestionFormData = {
        question: foundQuestion.question,
        type_question: foundQuestion.type_question,
        type_from: foundQuestion.type_from,
        language: foundQuestion.language,
        source_id: '', // Будет заполнено при загрузке полных данных
        points: 1,
        time_limit: 60,
        photo_url: foundQuestion.photo_url || '',
        explanation_ai: '',
        answer_variants: [
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' }
        ],
        correct_variant_index: 0
      }
      setEditingQuestionId(foundQuestion.id)
      setEditingQuestionData(questionData)
      setIsCreateModalOpen(true)
      setIsDetailsModalOpen(false) // Закрываем окно просмотра при редактировании
    }
  }

  const handleEditFromDetails = () => {
    if (viewingQuestion) {
      handleEdit(viewingQuestion)
    }
  }

  const handleUpdateQuestion = async (data: QuestionFormData) => {
    if (!editingQuestionId) return
    
    setIsCreating(true)
    try {
      // Здесь будет запрос к API для обновления вопроса
      console.log('Обновление вопроса:', editingQuestionId, data)
      
      // В реальном приложении:
      // await fetch(`/api/questions/${editingQuestionId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // })
      
      // Имитация задержки
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Обновляем локальные данные (в реальном приложении это будет через API)
      // Здесь можно обновить mockQuestions или перезагрузить данные
      
      setIsCreateModalOpen(false)
      setEditingQuestionId(null)
      setEditingQuestionData(null)
    } catch (error) {
      console.error('Ошибка при обновлении вопроса:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateQuestion = async (data: QuestionFormData) => {
    setIsCreating(true)
    try {
      // Получаем ID текущего пользователя для source_id
      const userResponse = await fetch('/api/user/me')
      const user = await userResponse.json()
      
      if (!user.id) {
        throw new Error('Пользователь не авторизован')
      }

      // Создаем вопрос через API
      const response = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source_id: user.id // ID текущего учителя
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Ошибка при создании вопроса')
      }

      // Обновляем список вопросов
      const questionsResponse = await fetch('/api/teacher/questions')
      const questionsResult = await questionsResponse.json()
      
      if (questionsResult.success && questionsResult.data) {
        setQuestions(questionsResult.data)
      }
      
      // После успешного создания закрываем модальное окно
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Ошибка при создании вопроса:', error)
      alert('Ошибка при создании вопроса. Попробуйте снова.')
    } finally {
      setIsCreating(false)
    }
  }

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {t('questions.title')}
          </h1>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Icons.Plus className="h-4 w-4 mr-2" />
            {t('questions.createQuestion')}
          </Button>
        </div>

        {/* Статистические карточки - отдельный контейнер */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title={t('questions.totalQuestions')}
            value={stats.total}
            icon={Icons.HelpCircle}
          />
          <StatCard
            title={t('questions.activeQuestions')}
            value={stats.active}
            icon={Icons.CheckCircle}
          />
          <StatCard
            title={t('questions.problematicQuestions')}
            value={stats.problematic}
            icon={Icons.Flag}
          />
          <StatCard
            title={t('questions.averageCorrect')}
            value={`${stats.averageCorrect}%`}
            icon={Icons.TrendingUp}
          />
        </div>

        {/* Фильтры - отдельный контейнер */}
        <div>
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
        </div>

        {/* Таблица вопросов - отдельный контейнер */}
        <div>
          <QuestionsTable
            questions={sortedQuestions}
            onQuestionClick={handleViewDetails}
            onQuestionEdit={handleEdit}
            isLoading={isLoading}
          />
        </div>

        {/* Модальное окно просмотра деталей вопроса */}
        <QuestionDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setViewingQuestion(null)
          }}
          question={viewingQuestion}
          onEdit={handleEditFromDetails}
              />

        {/* Модальное окно создания/редактирования вопроса */}
        <CreateQuestionModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingQuestionId(null)
            setEditingQuestionData(null)
          }}
          onSubmit={editingQuestionId ? handleUpdateQuestion : handleCreateQuestion}
          isLoading={isCreating}
          initialData={editingQuestionData ? { ...editingQuestionData, id: editingQuestionId || undefined } : undefined}
          mode={editingQuestionId ? 'edit' : 'create'}
        />
      </div>
    </TeacherLayout>
  )
}
