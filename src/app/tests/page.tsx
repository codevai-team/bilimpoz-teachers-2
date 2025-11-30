'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { generateTempId, saveDraftTest, setTestStatus, getDraftTests, getTestStatuses, getDraftTest } from '@/lib/test-storage'
import CreateTestModal from '@/components/teacher/CreateTestModal'
import { TestsPageSkeleton } from '@/components/ui/PageSkeletons'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import CustomTimePicker from '@/components/ui/CustomTimePicker'
import Select, { SelectOption } from '@/components/ui/Select'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast, { ToastVariant } from '@/components/ui/Toast'

interface Test {
  id: string
  name: string
  description: string
  questionsCount: number
  completionsCount: number
  createdAt: string
  updatedAt: string
  language: 'ru' | 'kg'
  status?: 'draft' | 'published'
}

export default function TestsPage() {
  const { t, ready } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [tests, setTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState<'all' | 'ru' | 'kg'>('all')
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all')
  const [period, setPeriod] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [testToDelete, setTestToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ isOpen: boolean; title?: string; message: string; variant: ToastVariant }>({
    isOpen: false,
    message: '',
    variant: 'success'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Редирект на страницу входа, если пользователь не авторизован
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/login')
    }
  }, [mounted, authLoading, user, router])

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
    setPeriod(newPeriod)
    
    // Автоматически устанавливаем даты для выбранного периода
    if (newPeriod !== 'all' && newPeriod !== 'custom') {
      const dates = getPeriodDates(newPeriod)
      setDateFrom(dates.dateFrom)
      setTimeFrom(dates.timeFrom)
      setDateTo(dates.dateTo)
      setTimeTo(dates.timeTo)
    }
  }

  // Опции для фильтра по языку
  const languageOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'all', label: getText('tests.allLanguages', 'Все языки') },
      { value: 'ru', label: getText('tests.russian', 'Русский') },
      { value: 'kg', label: getText('tests.kyrgyz', 'Кыргызский') }
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, mounted, ready])

  // Опции для фильтра по статусу
  const statusOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'all', label: getText('tests.allStatuses', 'Все статусы') },
      { value: 'draft', label: getText('tests.draft', 'Черновик') },
      { value: 'published', label: getText('tests.published', 'Опубликован') }
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, mounted, ready])

  // Фильтрация тестов
  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(search.toLowerCase()) ||
                         test.description.toLowerCase().includes(search.toLowerCase())
    const matchesLanguage = language === 'all' || test.language === language
    const matchesStatus = status === 'all' || (test.status && test.status === status)
    
    // Фильтрация по дате и времени
    let matchesDate = true
    // Фильтруем только если указана хотя бы одна дата
    if (dateFrom || dateTo) {
      const testDate = new Date(test.updatedAt || test.createdAt)
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom)
        if (timeFrom) {
          const [hours, minutes] = timeFrom.split(':')
          fromDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
        } else {
          fromDate.setHours(0, 0, 0, 0)
        }
        if (testDate < fromDate) {
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
        if (testDate > toDate) {
          matchesDate = false
        }
      }
    }
    
    return matchesSearch && matchesLanguage && matchesStatus && matchesDate
  })

  // Проверка, применены ли какие-либо фильтры
  const hasActiveFilters = useMemo(() => {
    return (
      search.trim() !== '' ||
      language !== 'all' ||
      status !== 'all' ||
      period !== '' ||
      dateFrom !== '' ||
      dateTo !== '' ||
      timeFrom !== '' ||
      timeTo !== ''
    )
  }, [search, language, status, period, dateFrom, dateTo, timeFrom, timeTo])

  // Очистка фильтров
  const handleClearFilters = () => {
    setSearch('')
    setLanguage('all')
    setStatus('all')
    setPeriod('')
    setDateFrom('')
    setTimeFrom('')
    setDateTo('')
    setTimeTo('')
  }

  // Создание нового теста - открываем модал
  const handleCreateTest = () => {
    if (!user?.id) {
      alert(getText('tests.authRequired', 'Необходима авторизация'))
      return
    }
    setIsCreateModalOpen(true)
  }

  // Открытие теста
  const handleOpenTest = (testId: string) => {
    router.push(`/tests/${testId}`)
  }

  // Удаление теста
  const handleDeleteTest = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTestToDelete(testId)
    setShowDeleteConfirm(true)
  }

  const executeDeleteTest = async () => {
    if (!testToDelete) return

    setIsDeleting(true)
    try {
      // Если это временный ID, удаляем из localStorage
      if (testToDelete.startsWith('temp-')) {
        const { removeDraftTest, removeTestStatus, removeTestQuestions } = await import('@/lib/test-storage')
        removeDraftTest(testToDelete)
        removeTestStatus(testToDelete)
        removeTestQuestions(testToDelete)
        setTests(tests.filter(t => t.id !== testToDelete))
        
        // Показываем уведомление об успешном удалении
        setToast({
          isOpen: true,
          title: 'Удалено!',
          message: getText('tests.testDeleted', 'Тест успешно удален'),
          variant: 'success'
        })
      } else {
        // Удаляем из БД
        const response = await fetch(`/api/teacher/tests/${testToDelete}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setTests(tests.filter(t => t.id !== testToDelete))
          
          // Показываем уведомление об успешном удалении
          setToast({
            isOpen: true,
            title: 'Удалено!',
            message: getText('tests.testDeleted', 'Тест успешно удален'),
            variant: 'success'
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          const errorText = errorData.error || getText('tests.deleteError', 'Ошибка при удалении теста')
          
          setToast({
            isOpen: true,
            title: 'Ошибка!',
            message: errorText,
            variant: 'error'
          })
        }
      }
    } catch (error) {
      console.error('Ошибка удаления теста:', error)
      const errorText = getText('tests.deleteError', 'Ошибка при удалении теста')
      
      setToast({
        isOpen: true,
        title: 'Ошибка!',
        message: errorText,
        variant: 'error'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setTestToDelete(null)
    }
  }

  // Показываем загрузку, пока не загрузились данные или идет проверка авторизации
  if (!mounted || authLoading) {
    return (
      <TeacherLayout>
        <TestsPageSkeleton />
      </TeacherLayout>
    )
  }

  // Если пользователь не авторизован, не показываем контент (будет редирект)
  if (!user) {
    return (
      <TeacherLayout>
        <TestsPageSkeleton />
      </TeacherLayout>
    )
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
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Язык */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('tests.language', 'Язык')}
              </label>
              <Select
                value={language}
                onChange={(value) => setLanguage(value as 'all' | 'ru' | 'kg')}
                options={languageOptions}
                placeholder={getText('tests.allLanguages', 'Все языки')}
              />
            </div>

            {/* Статус */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('tests.status', 'Статус')}
              </label>
              <Select
                value={status}
                onChange={(value) => setStatus(value as 'all' | 'draft' | 'published')}
                options={statusOptions}
                placeholder={getText('tests.allStatuses', 'Все статусы')}
              />
            </div>
          </div>

          {/* Период */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              {getText('questions.period', 'Период')}:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: getText('dashboard.today', 'Сегодня') },
                { value: 'yesterday', label: getText('dashboard.yesterday', 'Вчера') },
                { value: 'week', label: getText('dashboard.week', 'Неделя') },
                { value: 'month', label: getText('dashboard.month', 'Месяц') }
              ].map((option) => (
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
                  onChange={setDateFrom}
                />
                <CustomTimePicker
                  value={timeFrom}
                  onChange={setTimeFrom}
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
                  onChange={setDateTo}
                />
                <CustomTimePicker
                  value={timeTo}
                  onChange={setTimeTo}
                />
              </div>
            </div>
          </div>

          {/* Кнопка очистки фильтров */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {getText('questions.clearFilters', 'Очистить фильтры')}
              </button>
            </div>
          )}
        </div>

        {/* Список тестов */}
        {isLoading ? (
          <TestsPageSkeleton />
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
          <div className="space-y-4">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                onClick={() => handleOpenTest(test.id)}
                className="bg-[var(--bg-card)] rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all hover:bg-[var(--bg-hover)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 line-clamp-2">
                      {test.name}
                    </h3>
                    <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">
                      {test.description}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTest(test.id, e)}
                    className="ml-2 p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-red-400"
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mb-2">
                  <div className="flex items-center gap-1">
                    <Icons.HelpCircle className="h-3.5 w-3.5" />
                    <span>{test.questionsCount} {getText('tests.questions', 'вопросов')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Users className="h-3.5 w-3.5" />
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

      {/* Модал создания теста */}
      <CreateTestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        teacherId={user?.id || ''}
        onTestCreated={() => {
          // Показываем уведомление о создании теста
          setToast({
            isOpen: true,
            title: 'Тест создан!',
            message: getText('tests.testCreated', 'Тест успешно создан'),
            variant: 'success'
          })

          // Перезагружаем список тестов после создания
          const fetchTests = async () => {
            if (!user?.id) return

            setIsLoading(true)
            try {
              const response = await fetch(`/api/teacher/tests?teacherId=${user.id}`)
              const result = await response.json()

              if (result.success && result.data) {
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
                  questionsCount: 0,
                  completionsCount: 0,
                  createdAt: draft.createdAt,
                  updatedAt: draft.updatedAt,
                  language: draft.language,
                  status: 'draft'
                }))

                const { getTestQuestions } = await import('@/lib/test-storage')
                localTests.forEach((test: any) => {
                  const questions = getTestQuestions(test.id)
                  test.questionsCount = questions.length
                })

                setTests([...dbTests, ...localTests])
              }
            } catch (error) {
              console.error('Ошибка при загрузке тестов:', error)
            } finally {
              setIsLoading(false)
            }
          }

          fetchTests()
        }}
      />

      {/* Диалог подтверждения удаления теста */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false)
            setTestToDelete(null)
          }
        }}
        onConfirm={executeDeleteTest}
        title={getText('tests.deleteConfirmTitle', 'Удалить тест?')}
        message={getText('tests.deleteConfirmMessage', 'Вы уверены, что хотите удалить этот тест? Это действие нельзя отменить.')}
        confirmText={getText('common.delete', 'Удалить')}
        cancelText={getText('common.cancel', 'Отмена')}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Toast уведомления */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        variant={toast.variant}
        duration={4000}
      />
    </TeacherLayout>
  )
}

