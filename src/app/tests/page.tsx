'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { generateTempId, saveDraftTest, setTestStatus, getDraftTests, getTestStatuses, getDraftTest } from '@/lib/test-storage'

interface Test {
  id: string
  name: string
  description: string
  questionsCount: number
  completionsCount: number
  createdAt: string
  updatedAt: string
  language: 'ru' | 'kg'
}

export default function TestsPage() {
  const { t, ready } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [tests, setTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<'all' | 'ru' | 'kg'>('all')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Загрузка тестов
  useEffect(() => {
    const fetchTests = async () => {
      if (!mounted || !user?.id) return

      setIsLoading(true)
      try {
        // Загрузка из БД
        const response = await fetch(`/api/teacher/tests?teacherId=${user.id}`)
        const result = await response.json()

        if (result.success && result.data) {
          // Объединяем с черновиками из localStorage
          const draftTests = getDraftTests()
          const statuses = getTestStatuses()
          
          const dbTests = result.data.map((test: Test) => ({
            ...test,
            status: statuses[test.id] || 'published'
          }))

          const localTests = Object.values(draftTests).map((draft: any) => ({
            id: draft.id,
            name: draft.name,
            description: draft.description,
            questionsCount: 0, // Будет подсчитано из localStorage
            completionsCount: 0,
            createdAt: draft.createdAt,
            updatedAt: draft.updatedAt,
            language: draft.language,
            status: 'draft'
          }))

          // Подсчет вопросов для черновиков
          const { getTestQuestions } = await import('@/lib/test-storage')
          localTests.forEach((test: any) => {
            const questions = getTestQuestions(test.id)
            test.questionsCount = questions.length
          })

          setTests([...dbTests, ...localTests])
        } else {
          console.error('Ошибка загрузки тестов:', result.error)
          setTests([])
        }
      } catch (error) {
        console.error('Ошибка при загрузке тестов:', error)
        setTests([])
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted && user?.id) {
      fetchTests()
    }
  }, [mounted, user?.id])

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    // Если t() возвращает ключ (перевод не найден), используем fallback
    return translation === key ? fallback : translation
  }

  // Фильтрация тестов
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(search.toLowerCase()) ||
                         test.description.toLowerCase().includes(search.toLowerCase())
    const matchesLanguage = language === 'all' || test.language === language
    return matchesSearch && matchesLanguage
  })

  // Создание нового теста
  const handleCreateTest = () => {
    if (!user?.id) {
      alert(getText('tests.authRequired', 'Необходима авторизация'))
      return
    }

    try {
      const tempTestId = generateTempId()
      const newTest = {
        id: tempTestId,
        name: getText('tests.newTestName', 'Новый тест'),
        description: getText('tests.newTestDescription', 'Описание теста'),
        language: 'ru' as 'ru' | 'kg',
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teacherId: user.id
      }

      console.log('Создание теста:', newTest)
      saveDraftTest(newTest)
      setTestStatus(tempTestId, 'draft')
      
      // Проверяем, что тест сохранен
      const savedTest = getDraftTest(tempTestId)
      console.log('Сохраненный тест:', savedTest)
      
      if (!savedTest) {
        throw new Error('Тест не был сохранен в localStorage')
      }
      
      // Переход в редактор
      console.log('Переход на страницу:', `/tests/${tempTestId}`)
      router.push(`/tests/${tempTestId}`)
    } catch (error) {
      console.error('Ошибка создания теста:', error)
      alert(getText('tests.createError', 'Ошибка при создании теста') + ': ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  // Открытие теста
  const handleOpenTest = (testId: string) => {
    router.push(`/tests/${testId}`)
  }

  // Удаление теста
  const handleDeleteTest = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm(getText('tests.confirmDelete', 'Вы уверены, что хотите удалить этот тест?'))) {
      return
    }

    try {
      // Если это временный ID, удаляем из localStorage
      if (testId.startsWith('temp-')) {
        const { removeDraftTest, removeTestStatus, removeTestQuestions } = await import('@/lib/test-storage')
        removeDraftTest(testId)
        removeTestStatus(testId)
        removeTestQuestions(testId)
        setTests(tests.filter(t => t.id !== testId))
      } else {
        // Удаляем из БД
        const response = await fetch(`/api/teacher/tests/${testId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setTests(tests.filter(t => t.id !== testId))
        } else {
          alert(getText('tests.deleteError', 'Ошибка при удалении теста'))
        }
      }
    } catch (error) {
      console.error('Ошибка удаления теста:', error)
      alert(getText('tests.deleteError', 'Ошибка при удалении теста'))
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок и кнопка создания */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {getText('tests.title', 'Тесты')}
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {getText('tests.subtitle', 'Создавайте и управляйте тестами для ваших студентов')}
            </p>
          </div>
          <Button
            onClick={handleCreateTest}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Icons.Plus className="h-5 w-5" />
            {getText('tests.createTest', 'Создать тест')}
          </Button>
        </div>

        {/* Фильтры */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Поиск */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('tests.search', 'Поиск')}
              </label>
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={getText('tests.searchPlaceholder', 'Поиск по названию или описанию...')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* Язык */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('tests.language', 'Язык')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'all' | 'ru' | 'kg')}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="all">{getText('tests.allLanguages', 'Все языки')}</option>
                <option value="ru">{getText('tests.russian', 'Русский')}</option>
                <option value="kg">{getText('tests.kyrgyz', 'Кыргызский')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список тестов */}
        {isLoading ? (
          <div className="text-center py-12">
            <Icons.Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-tertiary)] mt-2">
              {getText('tests.loading', 'Загрузка тестов...')}
            </p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl p-12 text-center">
            <Icons.FileText className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {getText('tests.noTests', 'Нет тестов')}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              {getText('tests.noTestsDescription', 'Создайте первый тест для ваших студентов')}
            </p>
            <Button onClick={handleCreateTest} variant="primary">
              {getText('tests.createFirstTest', 'Создать тест')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                onClick={() => handleOpenTest(test.id)}
                className="bg-[var(--bg-card)] rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all border border-[var(--border-primary)] hover:border-[var(--accent-primary)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 line-clamp-2">
                      {test.name}
                    </h3>
                    <p className="text-sm text-[var(--text-tertiary)] line-clamp-2">
                      {test.description}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTest(test.id, e)}
                    className="ml-2 p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-red-400"
                  >
                    <Icons.Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)] mb-4">
                  <div className="flex items-center gap-1">
                    <Icons.HelpCircle className="h-4 w-4" />
                    <span>{test.questionsCount} {getText('tests.questions', 'вопросов')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Users className="h-4 w-4" />
                    <span>{test.completionsCount} {getText('tests.completions', 'прохождений')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {test.id.startsWith('temp-') ? (
                      <span className="text-yellow-400">{getText('tests.draft', 'Черновик')}</span>
                    ) : (
                      <span className="text-green-400">{getText('tests.published', 'Опубликован')}</span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(test.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}

