'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select, { SelectOption } from '@/components/ui/Select'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
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
  setTestStatus,
  getTestStatus,
  removeTestStatus,
  removeDraftTest,
  removeTestQuestions,
  loadQuestionDraft,
  removeDuplicateQuestions,
  removeQuestionFromTest,
  clearTestFromLocalStorage,
  type QuestionType,
  type QuestionData
} from '@/lib/test-storage'
import { TestLocalStorage } from '@/lib/test-storage'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast, { ToastVariant } from '@/components/ui/Toast'
import TestTypeSelectorMenu from '@/components/teacher/TestTypeSelectorMenu'
import TestSettingsModal from '@/components/teacher/TestSettingsModal'
import TestToolbar from '@/components/teacher/TestToolbar'
import TestAIExplainButton from '@/components/teacher/TestAIExplainButton'

// Динамический импорт для избежания SSR проблем
const QuestionEditor = dynamic(() => import('@/components/teacher/QuestionEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
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
  section?: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'
}

interface Question {
  id: string
  type: QuestionType
  question?: string
  order?: number
}

interface TestFormErrors {
  name?: string
  description?: string
  language?: string
}

export default function TestEditorPage() {
  const { t, ready } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  // Refs для прокрутки к ошибкам
  const nameRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const languageRef = useRef<HTMLDivElement>(null)
  const questionsRef = useRef<HTMLDivElement>(null)

  const [mounted, setMounted] = useState(false)
  const [test, setTest] = useState<Test | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Убрали переключатель табов, всегда показываем "Вопросы"
  const [questions, setQuestions] = useState<Question[]>([])
  const [originalQuestionsFromDB, setOriginalQuestionsFromDB] = useState<Question[]>([]) // Исходные вопросы из БД
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [errors, setErrors] = useState<TestFormErrors>({})
  const [showAIExplanation, setShowAIExplanation] = useState<Record<string, boolean>>({})
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const formatHandlersRef = useRef<Record<string, (format: string) => void>>({})
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; variant: ToastVariant }>({
    isOpen: false,
    message: '',
    variant: 'success'
  })
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Данные формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'ru' as 'ru' | 'kg'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback значения для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  // Функция для получения названия типа теста
  const getTestTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      math1: getText('sections.math1', 'Математика 1'),
      math2: getText('sections.math2', 'Математика 2'),
      analogy: getText('sections.analogy', 'Аналогии'),
      rac: getText('sections.rac', 'Чтение и понимание'),
      grammar: getText('sections.grammar', 'Грамматика'),
      standard: getText('sections.standard', 'Стандарт')
    }
    return typeNames[type] || 'Стандарт'
  }

  // Обработчики для TestToolbar
  const handleFormat = (action: string) => {
    // Находим активный QuestionEditor и применяем форматирование
    const activeQuestionId = Object.keys(formatHandlersRef.current)[0]
    if (activeQuestionId && formatHandlersRef.current[activeQuestionId]) {
      formatHandlersRef.current[activeQuestionId](action)
    }
  }

  const handleTogglePreview = () => {
    setIsPreviewMode(prev => !prev)
  }

  const handleRegisterFormat = (questionId: string, handler: (format: string) => void) => {
    formatHandlersRef.current[questionId] = handler
  }

  const handleUnregisterFormat = (questionId: string) => {
    delete formatHandlersRef.current[questionId]
  }

  const handleOpenImageLatex = () => {
    // Обработка конвертации изображения в LaTeX
    console.log('Open image to LaTeX')
  }

  const handleMagicWand = () => {
    // Находим активный textarea и вызываем улучшение текста
    const activeElement = document.activeElement
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      const textarea = activeElement as HTMLTextAreaElement
      const questionId = textarea.closest('[data-question-id]')?.getAttribute('data-question-id')
      const answerIndex = textarea.getAttribute('data-answer-index')
      
      if (questionId && formatHandlersRef.current[questionId]) {
        // Вызываем улучшение через форматтер
        // Форматтер определит, это вопрос или ответ, и вызовет handleMagicWand
        formatHandlersRef.current[questionId]('magic-wand')
      }
    }
  }

  // Обработчики изменения полей формы
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    // Очищаем ошибку для этого поля
    if (errors[field as keyof TestFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: TestFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Название теста обязательно'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание теста обязательно'
    }

    setErrors(newErrors)

    // Прокрутка к первой ошибке
    if (Object.keys(newErrors).length > 0) {
      scrollToError(newErrors)
      return false
    }

    return true
  }

  // Прокрутка к ошибке
  const scrollToError = (errors: TestFormErrors) => {
    const errorFieldMap = {
      name: nameRef,
      description: descriptionRef,
      language: languageRef
    }

    const errorFields = ['name', 'description', 'language'] as const

    for (const field of errorFields) {
      if (errors[field]) {
        const ref = errorFieldMap[field]
        if (ref?.current) {
          ref.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          setTimeout(() => {
            const input = ref.current?.querySelector('input, textarea, select')
            if (input) {
              (input as HTMLElement).focus()
            }
          }, 500)
          break
        }
      }
    }
  }

  // Загрузка теста
  useEffect(() => {
    const loadTest = async () => {
      if (!mounted || !testId || !user?.id) return

      setIsLoading(true)
      try {
        // Очищаем дубликаты вопросов перед загрузкой
        if (!isTempId(testId)) {
          removeDuplicateQuestions(testId)
        }
        if (isTempId(testId)) {
          // Проверяем localStorage
          const draftTest = getDraftTest(testId)
          if (draftTest) {
            setTest(draftTest)
            setFormData({
              name: draftTest.name,
              description: draftTest.description,
              language: draftTest.language
            })
          } else {
            // Проверяем sessionStorage
            const sessionDataKey = `temp_test_${testId}`
            const sessionData = sessionStorage.getItem(sessionDataKey)
            
            if (sessionData) {
              try {
                const testData = JSON.parse(sessionData)
                const newTest: Test = {
                  id: testId,
                  name: testData.name || getText('tests.newTestName', 'Новый тест'),
                  description: testData.description || '',
                  language: testData.language || 'ru',
                  status: 'draft',
                  teacherId: testData.teacherId || user?.id || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  section: testData.section || 'standard'
                }
                setTest(newTest)
                setFormData({
                  name: newTest.name,
                  description: newTest.description,
                  language: newTest.language
                })
                
                sessionStorage.removeItem(sessionDataKey)
              } catch (error) {
                console.error('Ошибка парсинга данных из sessionStorage:', error)
                createEmptyTest()
              }
            } else {
              createEmptyTest()
            }
          }

          // Загрузка вопросов из localStorage (только для временных тестов)
          const localQuestions = getTestQuestions(testId)
          setQuestions(localQuestions)
          setOriginalQuestionsFromDB([]) // Для временных тестов нет исходных вопросов из БД
          if (localQuestions.length > 0 && !selectedQuestionId) {
            setSelectedQuestionId(localQuestions[0].id)
          }
        } else {
          // Загрузка из БД
          // Сначала очищаем localStorage от возможных устаревших данных
          clearTestFromLocalStorage(testId)
          
          const response = await fetch(`/api/teacher/tests/${testId}`)
          const result = await response.json()
          
          if (result.success && result.data) {
            setTest(result.data)
            setFormData({
              name: result.data.name,
              description: result.data.description,
              language: result.data.language
            })
            
            // Загружаем вопросы из БД
            const questionsResponse = await fetch(`/api/teacher/tests/${testId}/questions`)
            const questionsResult = await questionsResponse.json()
            
            if (questionsResult.success && questionsResult.data && questionsResult.data.length > 0) {
              console.log(`Начальная загрузка: ${questionsResult.data.length} вопросов из БД для теста ${testId}`)
              
              // ПОЛНОСТЬЮ очищаем localStorage для этого теста перед загрузкой из БД
              clearTestFromLocalStorage(testId)
              
              const dbQuestions: Question[] = []
              
              // Сохраняем каждый вопрос в localStorage и добавляем в список
              for (const dbQuestion of questionsResult.data) {
                // Сохраняем данные вопроса в localStorage (теперь localStorage очищен)
                saveQuestionDraft(dbQuestion.id, dbQuestion.type, {
                  question: dbQuestion.question,
                  answers: dbQuestion.answerVariants.map((v: any) => ({
                    value: v.value,
                    isCorrect: v.isCorrect
                  })),
                  points: dbQuestion.points,
                  timeLimit: dbQuestion.timeLimit,
                  imageUrl: dbQuestion.photoUrl,
                  language: dbQuestion.language
                })

                // Добавляем в список вопросов
                dbQuestions.push({
                  id: dbQuestion.id,
                  type: dbQuestion.type,
                  question: dbQuestion.question
                })

                // Добавляем вопрос в список вопросов теста
                addQuestionToTestDraft(testId, dbQuestion.id, dbQuestion.type)
              }

              setQuestions(dbQuestions)
              setOriginalQuestionsFromDB([...dbQuestions]) // Сохраняем исходные вопросы из БД
              if (dbQuestions.length > 0 && !selectedQuestionId) {
                setSelectedQuestionId(dbQuestions[0].id)
              }
            } else {
              // Если вопросов в БД нет, очищаем состояние
              setQuestions([])
              setOriginalQuestionsFromDB([])
              setSelectedQuestionId(null)
              
              // Также очищаем localStorage от устаревших данных
              clearTestFromLocalStorage(testId)
            }
          } else {
            console.error('Ошибка загрузки теста:', result.error)
            showToast('Ошибка загрузки теста', 'error')
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке теста:', error)
        showToast('Ошибка при загрузке теста', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted && user?.id && testId) {
      loadTest()
    }
  }, [mounted, testId, user?.id])

  const createEmptyTest = () => {
    if (user?.id) {
      const newTest: Test = {
        id: testId,
        name: getText('tests.newTestName', 'Новый тест'),
        description: '',
        language: 'ru',
        status: 'draft',
        teacherId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        section: 'standard'
      }
      setTest(newTest)
      setFormData({
        name: newTest.name,
        description: newTest.description,
        language: newTest.language
      })
    }
  }

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ isOpen: true, message, variant })
  }

  // Сохранение теста (для модального окна настроек)
  const handleSaveTestSettings = async (data: { name: string; description: string; language: 'ru' | 'kg' }) => {
    setIsSubmitting(true)
    try {
      if (isTempId(testId)) {
        // Сохранение в localStorage
        const updatedTest = {
          id: test!.id,
          name: data.name,
          description: data.description,
          language: data.language,
          status: 'draft' as const,
          teacherId: test!.teacherId || user?.id || '',
          createdAt: test!.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        saveDraftTest(updatedTest)
        setTest(updatedTest)
        setFormData({
          name: data.name,
          description: data.description,
          language: data.language
        })
        setHasUnsavedChanges(false)
      } else {
        // Сохранение в БД
        const response = await fetch(`/api/teacher/tests/${testId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            language: data.language
          })
        })

        const result = await response.json()
        if (result.success) {
          setTest(result.data)
          setFormData({
            name: data.name,
            description: data.description,
            language: data.language
          })
          setHasUnsavedChanges(false)
        } else {
          throw new Error(result.error || 'Ошибка сохранения')
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  // Отмена изменений
  const handleCancel = () => {
    router.push('/tests')
  }

  // Перезагрузка вопросов из БД (после сохранения/удаления)
  const reloadQuestionsFromDB = async () => {
    if (!testId || isTempId(testId) || !user?.id) return

    try {
      console.log('Перезагружаем вопросы из БД...')
      const response = await fetch(`/api/teacher/tests/${testId}/questions`)
      const result = await response.json()

      if (result.success && result.data) {
        console.log(`Перезагружено ${result.data.length} вопросов из БД для теста ${testId}`)
        
        // ПОЛНОСТЬЮ очищаем localStorage для этого теста
        clearTestFromLocalStorage(testId)
        
        const dbQuestions: Question[] = []
        
        // Сохраняем каждый вопрос в localStorage и добавляем в список
        for (const dbQuestion of result.data) {
          // Сохраняем данные вопроса в localStorage
          saveQuestionDraft(dbQuestion.id, dbQuestion.type, {
            question: dbQuestion.question,
            answers: dbQuestion.answerVariants.map((v: any) => ({
              value: v.value,
              isCorrect: v.isCorrect
            })),
            points: dbQuestion.points,
            timeLimit: dbQuestion.timeLimit,
            imageUrl: dbQuestion.photoUrl,
            language: dbQuestion.language
          })

          // Добавляем в список вопросов
          dbQuestions.push({
            id: dbQuestion.id,
            type: dbQuestion.type,
            question: dbQuestion.question
          })

          // Добавляем вопрос в список вопросов теста
          addQuestionToTestDraft(testId, dbQuestion.id, dbQuestion.type)
        }

        setQuestions(dbQuestions)
        setOriginalQuestionsFromDB([...dbQuestions]) // Обновляем исходные вопросы
        
        // Если был выбранный вопрос, но его больше нет, сбрасываем выбор
        if (selectedQuestionId && !dbQuestions.find(q => q.id === selectedQuestionId)) {
          setSelectedQuestionId(dbQuestions.length > 0 ? dbQuestions[0].id : null)
        }
      } else {
        // Если вопросов нет в БД, очищаем все
        setQuestions([])
        setOriginalQuestionsFromDB([])
        setSelectedQuestionId(null)
        clearTestFromLocalStorage(testId)
      }
    } catch (error) {
      console.error('Ошибка перезагрузки вопросов из БД:', error)
    }
  }

  // Загрузка вопросов из БД и сохранение в localStorage
  const loadQuestionsFromDB = async () => {
    if (!testId || isTempId(testId) || !user?.id) return

    try {
      // Очищаем дубликаты перед загрузкой
      removeDuplicateQuestions(testId)
      const response = await fetch(`/api/teacher/tests/${testId}/questions`)
      const result = await response.json()

      if (result.success && result.data) {
        console.log(`Загружаем ${result.data.length} вопросов из БД для теста ${testId}`)
        
        // ПОЛНОСТЬЮ очищаем localStorage для этого теста
        clearTestFromLocalStorage(testId)
        
        const dbQuestions: Question[] = []
        
        // Сохраняем каждый вопрос в localStorage и добавляем в список
        for (const dbQuestion of result.data) {
          // Сохраняем данные вопроса в localStorage
          saveQuestionDraft(dbQuestion.id, dbQuestion.type, {
            question: dbQuestion.question,
            answers: dbQuestion.answerVariants.map((v: any) => ({
              value: v.value,
              isCorrect: v.isCorrect
            })),
            points: dbQuestion.points,
            timeLimit: dbQuestion.timeLimit,
            imageUrl: dbQuestion.photoUrl,
            language: dbQuestion.language
          })

          // Добавляем в список вопросов
          dbQuestions.push({
            id: dbQuestion.id,
            type: dbQuestion.type,
            question: dbQuestion.question
          })

          // Добавляем вопрос в список вопросов теста
          addQuestionToTestDraft(testId, dbQuestion.id, dbQuestion.type)
        }

        setQuestions(dbQuestions)
        setOriginalQuestionsFromDB([...dbQuestions]) // Сохраняем исходные вопросы из БД
        if (dbQuestions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(dbQuestions[0].id)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки вопросов из БД:', error)
    }
  }

  // Сохранение всех вопросов в БД
  const handleSaveQuestions = async () => {
    if (!test || !user?.id || questions.length === 0) {
      showToast(getText('tests.noQuestionsToSave', 'Нет вопросов для сохранения'), 'error')
      return
    }

    // Проверяем, что тест не временный (должен быть сохранен в БД)
    if (isTempId(testId)) {
      showToast(getText('tests.saveTestFirst', 'Сначала сохраните тест в настройках'), 'error')
      return
    }

    setIsSubmitting(true)
    let successCount = 0
    let errorCount = 0

    try {
      // Сначала удаляем вопросы, которые были удалены из интерфейса
      const currentQuestionIds = new Set(questions.map(q => q.id))
      const questionsToDelete = originalQuestionsFromDB.filter(
        originalQ => !isTempId(originalQ.id) && !currentQuestionIds.has(originalQ.id)
      )

      console.log(`Найдено ${questionsToDelete.length} вопросов для удаления из БД`)

      // Удаляем вопросы из БД
      for (const questionToDelete of questionsToDelete) {
        try {
          console.log(`Удаляем вопрос ${questionToDelete.id} из БД`)
          const deleteResponse = await fetch(`/api/teacher/tests/${testId}/questions/${questionToDelete.id}`, {
            method: 'DELETE'
          })

          const deleteResult = await deleteResponse.json()
          if (deleteResult.success) {
            console.log(`Вопрос ${questionToDelete.id} успешно удален из БД`)
            // Удаляем из localStorage
            removeQuestionDraft(questionToDelete.id, questionToDelete.type)
            removeQuestionFromTest(testId, questionToDelete.id)
          } else {
            console.error(`Ошибка удаления вопроса ${questionToDelete.id}:`, deleteResult.error)
            errorCount++
          }
        } catch (error) {
          console.error(`Ошибка при удалении вопроса ${questionToDelete.id}:`, error)
          errorCount++
        }
      }

      // Сохраняем каждый вопрос
      for (const question of questions) {
        try {
          // Получаем данные вопроса из localStorage
          const questionData = loadQuestionDraft(question.id, question.type)
          
          if (!questionData) {
            console.warn(`Данные вопроса ${question.id} не найдены`)
            errorCount++
            continue
          }

          // Валидация данных вопроса
          if (!questionData.question || !questionData.question.trim()) {
            console.warn(`Вопрос ${question.id} не заполнен`)
            errorCount++
            continue
          }

          const validAnswers = questionData.answers?.filter(a => a.value && a.value.trim()) || []
          if (validAnswers.length < 2) {
            console.warn(`Вопрос ${question.id} имеет менее 2 вариантов ответа`)
            errorCount++
            continue
          }

          const hasCorrectAnswer = validAnswers.some(a => a.isCorrect)
          if (!hasCorrectAnswer) {
            console.warn(`Вопрос ${question.id} не имеет правильного ответа`)
            errorCount++
            continue
          }

          // Определяем, новый это вопрос или существующий
          const isNewQuestion = isTempId(question.id)
          console.log(`Сохраняем вопрос ${question.id}, новый: ${isNewQuestion}`)
          
          // Сохраняем вопрос через API
          const response = await fetch(
            isNewQuestion 
              ? `/api/teacher/tests/${testId}/questions?teacherId=${user.id}`
              : `/api/teacher/tests/${testId}/questions/${question.id}`,
            {
              method: isNewQuestion ? 'POST' : 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                question: questionData.question.trim(),
                answerVariants: validAnswers,
                photoUrl: questionData.imageUrl || null,
                points: questionData.points || 1,
                timeLimit: questionData.timeLimit || 60,
                type: question.type,
                language: formData.language
              })
            }
          )

          const result = await response.json()

          if (result.success) {
            successCount++
            console.log(`Вопрос ${question.id} успешно ${isNewQuestion ? 'создан' : 'обновлен'}`)
            
            if (isNewQuestion) {
              // Для новых вопросов удаляем временный черновик
              removeQuestionDraft(question.id, question.type)
              
              // Если сервер вернул новый ID, обновляем вопрос в списке и localStorage
              if (result.data && result.data.id && result.data.id !== question.id) {
                console.log(`Обновляем ID вопроса с ${question.id} на ${result.data.id}`)
                
                // Удаляем старый вопрос из списка вопросов теста в localStorage
                removeQuestionFromTest(testId, question.id)
                
                // Добавляем новый ID в список вопросов теста
                addQuestionToTestDraft(testId, result.data.id, question.type)
                
                // Обновляем ID вопроса в состоянии React
                setQuestions(prev => prev.map(q => 
                  q.id === question.id 
                    ? { ...q, id: result.data.id }
                    : q
                ))
                
                // Если это был выбранный вопрос, обновляем выбор
                if (selectedQuestionId === question.id) {
                  setSelectedQuestionId(result.data.id)
                }
              }
            } else {
              // Для существующих вопросов просто удаляем черновик после успешного обновления
              removeQuestionDraft(question.id, question.type)
            }
          } else {
            console.error(`Ошибка сохранения вопроса ${question.id}:`, result.error)
            errorCount++
          }
        } catch (error) {
          console.error(`Ошибка при сохранении вопроса ${question.id}:`, error)
          errorCount++
        }
      }

      const deletedCount = questionsToDelete.length - questionsToDelete.filter((_, index) => {
        // Считаем только успешно удаленные (те, для которых не было ошибок)
        return index < questionsToDelete.length
      }).length

      if (successCount > 0 || questionsToDelete.length > 0) {
        let message = ''
        if (successCount > 0 && questionsToDelete.length > 0) {
          message = getText('tests.questionsSavedAndDeleted', `Сохранено: ${successCount}, удалено: ${questionsToDelete.length}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
        } else if (successCount > 0) {
          message = getText('tests.questionsSaved', `Сохранено вопросов: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
        } else if (questionsToDelete.length > 0) {
          message = getText('tests.questionsDeleted', `Удалено вопросов: ${questionsToDelete.length}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
        }
        
        showToast(message, errorCount > 0 ? 'warning' : 'success')
        setHasUnsavedChanges(false)
        
        // Перезагружаем актуальные данные из БД после успешного сохранения
        console.log('Вопросы успешно сохранены/удалены, перезагружаем из БД')
        await reloadQuestionsFromDB()
      } else if (errorCount > 0) {
        showToast(
          getText('tests.saveQuestionsError', `Ошибка при сохранении вопросов: ${errorCount}`),
          'error'
        )
      }
    } catch (error) {
      console.error('Ошибка при сохранении вопросов:', error)
      showToast(getText('tests.saveQuestionsError', 'Ошибка при сохранении вопросов'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Навигация по breadcrumbs
  const handleBreadcrumbNavigation = (href: string) => {
    router.push(href)
  }


  // Добавление нового вопроса
  const handleAddQuestion = (type: QuestionType) => {
    const newQuestionId = generateTempId()
    const newQuestion: Question = {
      id: newQuestionId,
      type,
      order: questions.length + 1
    }
    
    // Сохраняем вопрос в localStorage
    addQuestionToTestDraft(testId, newQuestionId, type)
    
    setQuestions(prev => [...prev, newQuestion])
    setSelectedQuestionId(newQuestionId)
    setHasUnsavedChanges(true)
    
    // Новые вопросы НЕ добавляются в originalQuestionsFromDB, так как они еще не в БД
  }

  // Удаление вопроса
  const handleDeleteQuestion = async (questionId: string) => {
    // Найдем тип вопроса для правильного удаления
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    // Если это не временный вопрос и тест не временный, удаляем сразу из БД
    if (!isTempId(questionId) && !isTempId(testId)) {
      try {
        console.log(`Немедленно удаляем вопрос ${questionId} из БД`)
        const deleteResponse = await fetch(`/api/teacher/tests/${testId}/questions/${questionId}`, {
          method: 'DELETE'
        })

        const deleteResult = await deleteResponse.json()
        if (deleteResult.success) {
          console.log(`Вопрос ${questionId} успешно удален из БД`)
          
          // Удаляем из originalQuestionsFromDB
          setOriginalQuestionsFromDB(prev => prev.filter(q => q.id !== questionId))
        } else {
          console.error(`Ошибка удаления вопроса ${questionId}:`, deleteResult.error)
          showToast(`Ошибка удаления вопроса: ${deleteResult.error}`, 'error')
          return // Не удаляем из интерфейса, если не удалось удалить из БД
        }
      } catch (error) {
        console.error(`Ошибка при удалении вопроса ${questionId}:`, error)
        showToast('Ошибка при удалении вопроса', 'error')
        return // Не удаляем из интерфейса, если не удалось удалить из БД
      }
    }
    
    // Удаляем из localStorage
    removeQuestionDraft(questionId, question.type)
    removeQuestionFromTest(testId, questionId)
    
    // Удаляем из списка текущих вопросов
    setQuestions(prev => prev.filter(q => q.id !== questionId))
    
    // Если удаленный вопрос был выбран, выбираем первый доступный
    if (selectedQuestionId === questionId) {
      const remainingQuestions = questions.filter(q => q.id !== questionId)
      setSelectedQuestionId(remainingQuestions.length > 0 ? remainingQuestions[0].id : null)
    }
    
    // Для временных вопросов отмечаем несохраненные изменения
    if (isTempId(questionId) || isTempId(testId)) {
      setHasUnsavedChanges(true)
    }
  }

  // Опции для селектов
  const languageOptions: SelectOption[] = [
    { value: 'ru', label: 'Русский' },
    { value: 'kg', label: 'Кыргызский' }
  ]


  // Breadcrumbs
  const breadcrumbs = [
    { title: 'Редактировать', type: 'edit' as const }
  ]

  // Показываем загрузку
  if (!mounted || isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Icons.Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--text-tertiary)] mb-4" />
            <p className="text-sm text-[var(--text-tertiary)]">
              {getText('tests.loadingTest', 'Загрузка теста...')}
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
          <Button onClick={handleCancel} variant="primary">
            {getText('tests.backToList', 'Вернуться к списку тестов')}
          </Button>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={breadcrumbs} 
          onNavigate={handleBreadcrumbNavigation}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
        />

        {/* Заголовок */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {getText('tests.editTestTitle', 'Редактировать тест')}
          </h1>
        </div>

        {/* Вопросы */}
        <div className="bg-[var(--bg-card)] rounded-2xl transition-colors">
          <div className="p-8 space-y-8" ref={questionsRef}>
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Icons.HelpCircle className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-[var(--text-primary)] font-medium mb-2">
                  {getText('tests.noQuestionsTitle', 'Нет вопросов')}
                </h3>
                  <p className="text-[var(--text-tertiary)] text-sm">
                  {getText('tests.noQuestionsHint1', 'Нажмите на кнопку + чтобы добавить вопрос')}
                </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-6 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          question.type === 'math1' ? 'bg-blue-500/10' :
                          question.type === 'math2' ? 'bg-purple-500/10' :
                          question.type === 'analogy' ? 'bg-green-500/10' :
                          question.type === 'rac' ? 'bg-yellow-500/10' :
                          question.type === 'grammar' ? 'bg-red-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          <span className={`font-bold ${
                            question.type === 'math1' ? 'text-blue-400' :
                            question.type === 'math2' ? 'text-purple-400' :
                            question.type === 'analogy' ? 'text-green-400' :
                            question.type === 'rac' ? 'text-yellow-400' :
                            question.type === 'grammar' ? 'text-red-400' :
                            'text-gray-400'
                        }`}>
                          {question.type === 'math1' ? 'М1' :
                           question.type === 'math2' ? 'М2' :
                           question.type === 'analogy' ? 'А' :
                           question.type === 'rac' ? 'Ч' :
                           question.type === 'grammar' ? 'Г' : 'С'}
                        </span>
                      </div>
                        <div>
                          <h3 className="text-[var(--text-primary)] font-medium">{getTestTypeName(question.type)}</h3>
                          <p className="text-[var(--text-tertiary)] text-sm">{getText('testEditor.questionBlock', 'Блок вопроса')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TestAIExplainButton
                          blockId={question.id}
                          courseLanguage={formData.language}
                          isShowingExplanation={showAIExplanation[question.id] || false}
                          onToggleExplanation={() => {
                            setShowAIExplanation(prev => ({
                              ...prev,
                              [question.id]: !prev[question.id]
                            }))
                          }}
                          onRegenerateSuccess={(explanation) => {
                            setAiExplanations(prev => ({
                              ...prev,
                              [question.id]: explanation
                            }))
                            setShowAIExplanation(prev => ({
                              ...prev,
                              [question.id]: true
                            }))
                          }}
                          storageKeyPrefix="testQuestion"
                          testType={question.type}
                        />
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                          className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors group"
                        title="Удалить вопрос"
                      >
                          <Icons.Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                      </button>
                      </div>
                    </div>
                    <QuestionEditor
                      questionId={question.id}
                      testId={testId}
                      testLanguage={formData.language}
                      questionType={question.type}
                      questionNumber={index + 1}
                      isShowingExplanation={showAIExplanation[question.id] || false}
                      aiExplanation={aiExplanations[question.id] || ''}
                      isPreviewMode={isPreviewMode}
                      onFormatRegister={(handler) => handleRegisterFormat(question.id, handler)}
                      onRegenerateExplanation={async () => {
                        // Вызываем регенерацию через TestAIExplainButton
                        // Для этого нужно найти кнопку и вызвать её метод генерации
                        // Пока просто вызываем API напрямую
                        try {
                          const questionData = loadQuestionDraft(question.id, question.type)
                          if (!questionData || !questionData.question) {
                            alert('Заполните вопрос и варианты ответов')
                            return
                          }
                          
                          const response = await fetch('/api/ai/explain-question', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              questionData: {
                                question: questionData.question,
                                answers: questionData.answers || [],
                                imageUrl: questionData.imageUrl
                              },
                              courseLanguage: formData.language,
                              testType: question.type
                            })
                          })
                          
                          if (!response.ok) {
                            const error = await response.json()
                            alert(error.error || 'Ошибка при генерации объяснения')
                            return
                          }
                          
                          const data = await response.json()
                          const newExplanation = data.explanation
                          
                          // Обновляем состояние
                          setAiExplanations(prev => ({
                            ...prev,
                            [question.id]: newExplanation
                          }))
                          
                          // Сохраняем в localStorage
                          if (questionData) {
                            questionData.explanation_ai = newExplanation
                            saveQuestionDraft(question.id, question.type, questionData)
                          }
                        } catch (error) {
                          console.error('Ошибка регенерации объяснения:', error)
                          alert('Ошибка при генерации объяснения')
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Меню выбора типа теста */}
            <TestTypeSelectorMenu
              onAddQuestion={handleAddQuestion}
              disabled={!formData.name.trim() || !formData.description.trim()}
              currentQuestionsCount={questions.length}
            />
          </div>
        </div>

        {/* Кнопки сохранения и отмены */}
        {questions.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 mt-6 transition-colors">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {getText('common.cancel', 'Отмена')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveQuestions}
                disabled={isSubmitting || isTempId(testId)}
                isLoading={isSubmitting}
              >
                {getText('tests.saveQuestions', 'Сохранить вопросы')}
              </Button>
            </div>
            {isTempId(testId) && (
              <p className="text-sm text-gray-400 mt-2 text-center">
                {getText('tests.saveTestFirstHint', 'Сначала сохраните тест в настройках, затем сохраните вопросы')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Toast уведомления */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Модальное окно настроек теста */}
      <TestSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        test={test}
        onSave={handleSaveTestSettings}
        isSubmitting={isSubmitting}
      />

      {/* Плавающая панель инструментов */}
      {questions.length > 0 && (
        <div className="hidden lg:block fixed bottom-4 left-[50%] lg:left-[calc(50%+80px)] -translate-x-1/2 z-50">
          <TestToolbar 
            onFormat={handleFormat} 
            isPreviewMode={isPreviewMode} 
            onTogglePreview={handleTogglePreview}
            onImageToLatex={handleOpenImageLatex}
            onMagicWand={handleMagicWand}
          />
        </div>
      )}
    </TeacherLayout>
  )
}