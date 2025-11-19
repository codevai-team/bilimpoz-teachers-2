'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  isTempId, 
  getDraftTest, 
  saveDraftTest, 
  getTestQuestions,
  generateTempId,
  addQuestionToTestDraft,
  saveQuestionDraft,
  removeQuestionDraft,
  type QuestionType
} from '@/lib/test-storage'

// Динамический импорт для избежания SSR проблем
const QuestionEditor = dynamic(() => import('@/components/teacher/QuestionEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
        <p className="text-sm text-[var(--text-tertiary)]">Загрузка редактора...</p>
      </div>
    </div>
  )
})

interface Test {
  id: string
  name: string
  description: string
  language: 'ru' | 'kg'
  status?: 'draft' | 'published'
  teacherId?: string
  createdAt?: string
  updatedAt?: string
}

interface Question {
  id: string
  type: QuestionType
  question?: string
  order?: number
}

export default function TestEditorPage() {
  const { t, ready } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [mounted, setMounted] = useState(false)
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'questions' | 'settings'>('questions')
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [testName, setTestName] = useState('')
  const [testDescription, setTestDescription] = useState('')
  const [testLanguage, setTestLanguage] = useState<'ru' | 'kg'>('ru')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Загрузка теста
  useEffect(() => {
    const loadTest = async () => {
      if (!mounted || !testId) return

      setIsLoading(true)
      try {
        if (isTempId(testId)) {
          // Загрузка из localStorage
          const draftTest = getDraftTest(testId)
          if (draftTest) {
            setTest(draftTest)
            setTestName(draftTest.name)
            setTestDescription(draftTest.description)
            setTestLanguage(draftTest.language)
          } else {
            // Если черновик не найден, создаем новый
            if (user?.id) {
              const newTest: Test = {
                id: testId,
                name: getText('tests.newTestName', 'Новый тест'),
                description: getText('tests.newTestDescription', 'Описание теста'),
                language: 'ru',
                status: 'draft',
                teacherId: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              saveDraftTest({
                ...newTest,
                status: 'draft',
                teacherId: user.id
              })
              setTest(newTest)
              setTestName(newTest.name)
              setTestDescription(newTest.description)
              setTestLanguage(newTest.language)
            }
          }

          // Загрузка вопросов из localStorage
          const localQuestions = getTestQuestions(testId)
          setQuestions(localQuestions)
          if (localQuestions.length > 0 && !selectedQuestionId) {
            setSelectedQuestionId(localQuestions[0].id)
          }
        } else {
          // Загрузка из БД
          const response = await fetch(`/api/teacher/tests/${testId}`)
          const result = await response.json()

          if (result.success && result.data) {
            setTest(result.data)
            setTestName(result.data.name)
            setTestDescription(result.data.description)
            setTestLanguage(result.data.language)

            // Загрузка вопросов из БД
            const questionsResponse = await fetch(`/api/teacher/tests/${testId}/questions`)
            const questionsResult = await questionsResponse.json()
            if (questionsResult.success) {
              setQuestions(questionsResult.data)
              if (questionsResult.data.length > 0 && !selectedQuestionId) {
                setSelectedQuestionId(questionsResult.data[0].id)
              }
            }
          } else {
            console.error('Ошибка загрузки теста:', result.error)
            alert(getText('tests.loadError', 'Ошибка загрузки теста'))
            router.push('/tests')
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке теста:', error)
        alert(getText('tests.loadError', 'Ошибка загрузки теста'))
        router.push('/tests')
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted && testId) {
      loadTest()
    }
  }, [mounted, testId, user?.id])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  // Сохранение настроек теста
  const handleSaveTestSettings = () => {
    if (!test || !user?.id) return

    if (isTempId(test.id)) {
      const updatedTest = {
        ...test,
        name: testName.trim(),
        description: testDescription.trim(),
        language: testLanguage,
        updatedAt: new Date().toISOString(),
        teacherId: user.id,
        status: 'draft' as const
      }
      saveDraftTest(updatedTest)
      setTest(updatedTest)
      alert(getText('tests.saved', 'Изменения сохранены'))
    }
  }

  // Добавление нового вопроса
  const handleAddQuestion = () => {
    if (!test) return

    const newQuestionId = generateTempId()
    const newQuestion: Question = {
      id: newQuestionId,
      type: 'standard',
      question: '',
      order: questions.length
    }

    // Сохраняем в localStorage
    addQuestionToTestDraft(test.id, newQuestionId, 'standard')
    saveQuestionDraft(newQuestionId, 'standard', {
      question: '',
      answers: [{ value: '', isCorrect: false }, { value: '', isCorrect: false }],
      points: 1,
      timeLimit: 60,
      language: test.language
    })

    setQuestions([...questions, newQuestion])
    setSelectedQuestionId(newQuestionId)
  }

  // Удаление вопроса
  const handleDeleteQuestion = (questionId: string) => {
    if (!window.confirm(getText('tests.confirmDeleteQuestion', 'Удалить этот вопрос?'))) {
      return
    }

    const question = questions.find(q => q.id === questionId)
    if (question) {
      removeQuestionDraft(questionId, question.type)
    }

    const updatedQuestions = questions.filter(q => q.id !== questionId)
    setQuestions(updatedQuestions)

    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(updatedQuestions.length > 0 ? updatedQuestions[0].id : null)
    }
  }

  // Возврат к списку тестов
  const handleBack = () => {
    router.push('/tests')
  }

  // Получаем название типа вопроса
  const getQuestionTypeName = (type: QuestionType) => {
    const typeNames = {
      standard: getText('tests.types.standard', 'С'),
      analogy: getText('tests.types.analogy', 'А'),
      grammar: getText('tests.types.grammar', 'Г'),
      math1: getText('tests.types.math1', 'М1'),
      math2: getText('tests.types.math2', 'М2'),
      rac: getText('tests.types.rac', 'Р')
    }
    return typeNames[type] || type
  }

  // Получаем цвет для типа вопроса
  const getQuestionTypeColor = (type: QuestionType) => {
    const typeColors = {
      standard: 'bg-gray-500',
      analogy: 'bg-green-500',
      grammar: 'bg-red-500',
      math1: 'bg-blue-500',
      math2: 'bg-purple-500',
      rac: 'bg-orange-500'
    }
    return typeColors[type] || 'bg-gray-500'
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Icons.Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-sm text-[var(--text-tertiary)]">
              {getText('tests.loading', 'Загрузка теста...')}
            </p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  if (!test) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-[var(--text-tertiary)] mb-4">
            {getText('tests.testNotFound', 'Тест не найден')}
          </p>
          <Button onClick={handleBack} variant="primary">
            {getText('tests.backToList', 'Вернуться к списку тестов')}
          </Button>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="flex flex-col h-screen">
        {/* Заголовок */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-card)] border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <Icons.ArrowLeft className="h-5 w-5 text-[var(--text-primary)]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {testName || getText('tests.editTest', 'Редактирование теста')}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {test.status === 'draft' 
                  ? getText('tests.draft', 'Черновик')
                  : getText('tests.published', 'Опубликован')
                }
              </p>
            </div>
          </div>
          <Button onClick={handleSaveTestSettings} variant="primary">
            {getText('tests.save', 'Сохранить')}
          </Button>
        </div>

        {/* Основной контент: 2 колонки */}
        <div className="flex flex-1 overflow-hidden">
          {/* Левая панель - Список вопросов */}
          <div className="w-80 bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col">
            {/* Вкладки */}
            <div className="flex border-b border-[var(--border-primary)]">
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'questions'
                    ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {getText('tests.tabs.questions', 'Вопросы')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {getText('tests.tabs.settings', 'Настройки')}
              </button>
            </div>

            {/* Контент вкладок */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'questions' ? (
                <div className="p-4 space-y-2">
                  {/* Кнопка добавления вопроса */}
                  <button
                    onClick={handleAddQuestion}
                    className="w-full p-4 border-2 border-dashed border-[var(--border-primary)] rounded-lg hover:border-[var(--accent-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-2 text-[var(--text-secondary)]"
                  >
                    <Icons.Plus className="h-5 w-5" />
                    <span>{getText('tests.addQuestion', 'Добавить вопрос')}</span>
                  </button>

                  {/* Список вопросов */}
                  {questions.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-tertiary)]">
                      <Icons.HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">{getText('tests.noQuestions', 'Вопросы пока не добавлены')}</p>
                    </div>
                  ) : (
                    questions.map((q, index) => (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestionId(q.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedQuestionId === q.id
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                            : 'border-[var(--border-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Номер вопроса */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold text-sm flex-shrink-0">
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Тип вопроса */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getQuestionTypeColor(q.type)}`}>
                                  {getQuestionTypeName(q.type)}
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)]">
                                  {getText(`tests.types.${q.type}Full`, q.type)}
                                </span>
                              </div>
                              
                              {/* Текст вопроса (если есть) */}
                              {q.question && (
                                <p className="text-sm text-[var(--text-secondary)] truncate">
                                  {q.question}
                                </p>
                              )}
                              {!q.question && (
                                <p className="text-sm text-[var(--text-tertiary)] italic">
                                  {getText('tests.newQuestion', 'Новый вопрос')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Кнопка удаления */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteQuestion(q.id)
                            }}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                          >
                            <Icons.Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Вкладка настроек
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      {getText('tests.testName', 'Название теста')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder={getText('tests.testNamePlaceholder', 'Введите название теста')}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      {getText('tests.testDescription', 'Описание теста')}
                    </label>
                    <textarea
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                      placeholder={getText('tests.testDescriptionPlaceholder', 'Введите описание теста')}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      {getText('tests.language', 'Язык')} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={testLanguage}
                      onChange={(e) => setTestLanguage(e.target.value as 'ru' | 'kg')}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                    >
                      <option value="ru">{getText('tests.russian', 'Русский')}</option>
                      <option value="kg">{getText('tests.kyrgyz', 'Кыргызский')}</option>
                    </select>
                  </div>

                  <Button onClick={handleSaveTestSettings} variant="primary" className="w-full">
                    {getText('tests.save', 'Сохранить')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Правая панель - Редактор вопроса */}
          <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
            {selectedQuestionId ? (
              <QuestionEditor
                questionId={selectedQuestionId}
                testId={testId}
                testLanguage={testLanguage}
                onQuestionUpdate={(questionId, data) => {
                  // Обновляем текст вопроса в списке
                  setQuestions(prev => prev.map(q => 
                    q.id === questionId ? { ...q, question: data.question, type: data.type } : q
                  ))
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">
                <div className="text-center">
                  <Icons.HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{getText('tests.selectQuestion', 'Выберите вопрос для редактирования')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}
