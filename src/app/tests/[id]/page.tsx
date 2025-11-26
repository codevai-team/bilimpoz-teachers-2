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
import { useAI } from '@/hooks/useAI'
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
  clearSavedQuestionsFromLocalStorage,
  getTempQuestions,
  getMinAnswersCountForType,
  getMaxAnswersCountForType,
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
  const [aiLoadingStates, setAiLoadingStates] = useState<Record<string, boolean>>({})
  const [savedSelection, setSavedSelection] = useState<{
    questionId: string | null
    fieldType: 'question' | 'answer' | null
    answerIndex: number | null
    start: number
    end: number
    text: string
  } | null>(null)
  const [questionValidationErrors, setQuestionValidationErrors] = useState<Record<string, string>>({})
  
  // AI хук для конвертации изображения
  const { convertImageToLatex, isLoading: isAiConverting } = useAI()
  const imageInputRef = useRef<HTMLInputElement>(null)
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

  // Автоматическая очистка ошибок валидации при исправлении вопросов
  useEffect(() => {
    if (!mounted) return

    const checkAndClearErrors = () => {
      setQuestionValidationErrors(prevErrors => {
        if (Object.keys(prevErrors).length === 0) return prevErrors

        const updatedErrors: Record<string, string> = {}
        let hasChanges = false

        for (const [questionId, error] of Object.entries(prevErrors)) {
          const question = questions.find(q => q.id === questionId)
          if (!question) {
            // Вопрос удален, убираем ошибку
            hasChanges = true
            continue
          }

          const questionData = loadQuestionDraft(questionId, question.type)
          if (!questionData) {
            // Если ошибка была "Данные вопроса не найдены", оставляем её
            if (error.includes('Данные вопроса не найдены')) {
              updatedErrors[questionId] = error
            } else {
              // Для других ошибок, если данных нет, убираем ошибку
              hasChanges = true
            }
            continue
          }

          // Проверяем, исправлена ли ошибка
          const validAnswers = questionData.answers?.filter(a => a.value && a.value.trim()) || []
          const hasCorrectAnswer = validAnswers.some(a => a.isCorrect)
          const hasQuestionText = questionData.question && questionData.question.trim()
          const hasMinAnswers = validAnswers.length >= 2

          let isFixed = false

          // Проверяем тип ошибки и исправлена ли она
          if (error.includes('Не выбран правильный ответ')) {
            isFixed = hasCorrectAnswer && validAnswers.length > 0
          } else if (error.includes('Текст вопроса не заполнен')) {
            isFixed = hasQuestionText
          } else if (error.includes('Необходимо минимум 2 варианта ответа')) {
            isFixed = hasMinAnswers
          } else if (error.includes('Данные вопроса не найдены')) {
            isFixed = !!questionData
          }

          if (isFixed) {
            // Ошибка исправлена, не добавляем в updatedErrors
            hasChanges = true
          } else {
            // Ошибка не исправлена, оставляем её
            updatedErrors[questionId] = error
          }
        }

        // Возвращаем обновленные ошибки только если что-то изменилось
        if (hasChanges) {
          return updatedErrors
        }
        return prevErrors
      })
    }

    // Проверяем сразу
    checkAndClearErrors()

    // Устанавливаем интервал для периодической проверки (каждые 500мс)
    const interval = setInterval(checkAndClearErrors, 500)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, questions])

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
    // Открываем диалог выбора файла
    if (imageInputRef.current) {
      imageInputRef.current.click()
    }
  }

  const handleImageFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      // Восстанавливаем фокус, даже если файл не выбран
      restoreFocusToActiveField()
      return
    }

    // Сохраняем активное поле перед обработкой
    const activeElementBefore = document.activeElement as HTMLElement
    const savedTextarea = activeElementBefore && activeElementBefore.tagName === 'TEXTAREA' 
      ? activeElementBefore as HTMLTextAreaElement 
      : null

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Неподдерживаемый тип файла. Используйте JPEG, PNG, GIF или WebP')
      restoreFocusToActiveField(savedTextarea)
      return
    }

    // Проверяем размер файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Размер файла превышает 5MB')
      restoreFocusToActiveField(savedTextarea)
      return
    }

    try {
      console.log('🖼️ Начинаем конвертацию изображения в LaTeX...')
      
      // Конвертируем изображение в LaTeX
      const latexCode = await convertImageToLatex(file)
      
      if (!latexCode || latexCode.trim() === '') {
        alert('Не удалось распознать формулу на изображении')
        restoreFocusToActiveField(savedTextarea)
        return
      }

      console.log('✅ LaTeX код получен:', latexCode.substring(0, 50))

      // Используем сохраненное поле или находим активное
      const textarea = savedTextarea || (document.activeElement && document.activeElement.tagName === 'TEXTAREA' 
        ? document.activeElement as HTMLTextAreaElement 
        : null)
      
      if (textarea) {
        const questionId = textarea.closest('[data-question-id]')?.getAttribute('data-question-id')
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const currentValue = textarea.value
        
        // Формируем LaTeX формулу (блочная формула с $$)
        const latexFormula = `$$${latexCode}$$`
        const newValue = currentValue.substring(0, start) + latexFormula + currentValue.substring(end)
        
        // Определяем тип поля
        const container = textarea.closest('[data-question-id]')
        const questionTextarea = container?.querySelector('textarea:not([data-answer-index])')
        const isQuestionTextarea = textarea === questionTextarea
        const answerIndexAttr = textarea.getAttribute('data-answer-index')
        const answerIndex = answerIndexAttr !== null ? parseInt(answerIndexAttr) : null
        
        // Вставляем текст в textarea
        textarea.value = newValue
        
        // Устанавливаем курсор после вставленной формулы
        const newPosition = start + latexFormula.length
        textarea.setSelectionRange(newPosition, newPosition)
        
        // Триггерим события для обновления состояния React
        const inputEvent = new Event('input', { bubbles: true })
        const changeEvent = new Event('change', { bubbles: true })
        textarea.dispatchEvent(inputEvent)
        textarea.dispatchEvent(changeEvent)
        
        // Если есть форматтер, обновляем через него для синхронизации состояния
        if (questionId && formatHandlersRef.current[questionId]) {
          // Используем специальную команду для вставки текста
          // Используем JSON для безопасной передачи данных
          if (isQuestionTextarea) {
            // Обновляем вопрос
            formatHandlersRef.current[questionId](`insert-text:${JSON.stringify(newValue)}`)
          } else if (answerIndex !== null) {
            // Обновляем ответ
            formatHandlersRef.current[questionId](`insert-answer-text:${answerIndex}:${JSON.stringify(newValue)}`)
          }
        }
        
        // Фокусируем обратно на textarea
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(newPosition, newPosition)
        }, 0)
        
        showToast('Формула успешно вставлена', 'success')
        // Восстанавливаем фокус после успешной вставки
        restoreFocusToActiveField(textarea)
      } else {
        alert('Выберите поле для вставки формулы')
        restoreFocusToActiveField()
      }
    } catch (error) {
      console.error('❌ Ошибка конвертации изображения:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка при конвертации изображения: ${errorMessage}`)
      restoreFocusToActiveField()
    } finally {
      // Очищаем input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  // Функция для восстановления фокуса на активном поле
  const restoreFocusToActiveField = (savedTextarea?: HTMLTextAreaElement | null) => {
    setTimeout(() => {
      // Пытаемся найти активное textarea
      const activeElement = savedTextarea || (document.activeElement && document.activeElement.tagName === 'TEXTAREA'
        ? document.activeElement as HTMLTextAreaElement
        : null)
      
      if (!activeElement) {
        // Ищем последний активный textarea на странице
        const allTextareas = document.querySelectorAll('textarea')
        if (allTextareas.length > 0) {
          const lastTextarea = allTextareas[allTextareas.length - 1] as HTMLTextAreaElement
          lastTextarea.focus()
        }
      } else {
        activeElement.focus()
      }
    }, 100)
  }

  const handleExplainQuestion = () => {
    // Находим активный вопрос и генерируем объяснение
    if (selectedQuestionId) {
      const questionData = loadQuestionDraft(selectedQuestionId, questions.find(q => q.id === selectedQuestionId)?.type || 'standard')
      
      if (!questionData || !questionData.question) {
        alert('Сначала заполните вопрос')
        return
      }

      if (!questionData.answers || questionData.answers.length < 2) {
        alert('Добавьте минимум 2 варианта ответа')
        return
      }

      const hasCorrectAnswer = questionData.answers.some(a => a.isCorrect)
      if (!hasCorrectAnswer) {
        alert('Выберите правильный ответ')
        return
      }

      // Вызываем генерацию объяснения
      handleRegenerateExplanation(selectedQuestionId)
    } else {
      alert('Выберите вопрос для объяснения')
    }
  }

  const handleRegenerateExplanation = async (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    try {
      const questionData = loadQuestionDraft(questionId, question.type)
      if (!questionData) return

      const response = await fetch('/api/ai/explain-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionData: {
            question: questionData.question,
            answers: questionData.answers,
            imageUrl: questionData.imageUrl
          },
          courseLanguage: testLanguage,
          testType: question.type
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка генерации объяснения')
      }

      const data = await response.json()
      const newExplanation = data.explanation

      // Сохраняем объяснение
      setAiExplanations(prev => ({
        ...prev,
        [questionId]: newExplanation
      }))

      // Обновляем данные вопроса
      questionData.explanation_ai = newExplanation
      saveQuestionDraft(questionId, question.type, questionData)

      // Показываем объяснение
      setShowAIExplanation(prev => ({
        ...prev,
        [questionId]: true
      }))

    } catch (error) {
      console.error('Ошибка генерации объяснения:', error)
      alert('Ошибка при генерации объяснения')
    }
  }

  // Сохранение выделения перед кликом на кнопку (синхронно, до потери фокуса)
  const handleSaveSelection = () => {
    // Проверяем все textarea на странице, чтобы найти активное выделение
    const allTextareas = document.querySelectorAll('textarea')
    
    for (const textarea of allTextareas) {
      const htmlTextarea = textarea as HTMLTextAreaElement
      const start = htmlTextarea.selectionStart
      const end = htmlTextarea.selectionEnd
      
      // Если есть выделение в этом textarea
      if (start !== end) {
        const selectedText = htmlTextarea.value.substring(start, end).trim()
        
        if (selectedText) {
          const questionId = htmlTextarea.closest('[data-question-id]')?.getAttribute('data-question-id') ||
                            htmlTextarea.closest('[data-test-question-id]')?.getAttribute('data-test-question-id')
          
          const answerIndexAttr = htmlTextarea.getAttribute('data-answer-index')
          const answerIndex = answerIndexAttr !== null ? parseInt(answerIndexAttr) : null
          
          // Определяем тип поля
          const container = htmlTextarea.closest('[data-question-id]')
          const questionTextarea = container?.querySelector('textarea:not([data-answer-index])')
          const isQuestionTextarea = htmlTextarea === questionTextarea
          
          if (questionId) {
            setSavedSelection({
              questionId,
              fieldType: isQuestionTextarea ? 'question' : (answerIndex !== null ? 'answer' : null),
              answerIndex,
              start,
              end,
              text: selectedText
            })
            console.log('💾 Выделение сохранено синхронно:', { questionId, fieldType: isQuestionTextarea ? 'question' : 'answer', answerIndex, start, end, text: selectedText.substring(0, 50) })
            return // Сохранили, выходим
          }
        }
      }
    }
    
    console.log('⚠️ Выделение не найдено для сохранения')
  }

  const handleMagicWand = () => {
    console.log('🔮 handleMagicWand вызван из page.tsx')
    
    // Используем сохраненное выделение, если оно есть
    if (savedSelection && savedSelection.questionId && savedSelection.fieldType) {
      console.log('📋 Используем сохраненное выделение:', savedSelection)
      
      if (formatHandlersRef.current[savedSelection.questionId]) {
        console.log('✅ Вызываем форматтер для questionId:', savedSelection.questionId)
        // Вызываем улучшение через форматтер с сохраненными данными
        formatHandlersRef.current[savedSelection.questionId]('magic-wand')
        // Очищаем сохраненное выделение
        setSavedSelection(null)
        return
      }
    }
    
    // Fallback: пытаемся найти активный textarea
    const activeElement = document.activeElement
    console.log('📋 Активный элемент:', { tagName: activeElement?.tagName, id: activeElement?.id })
    
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      const textarea = activeElement as HTMLTextAreaElement
      
      // Проверяем, есть ли выделенный текст в textarea
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end).trim()
      
      console.log('✂️ Выделение в textarea:', { start, end, selectedText: selectedText.substring(0, 50), length: selectedText.length })
      
      if (!selectedText || start === end) {
        alert('Выделите текст, который нужно улучшить')
        return
      }

      // Находим questionId из ближайшего родителя
      const questionId = textarea.closest('[data-question-id]')?.getAttribute('data-question-id') ||
                        textarea.closest('[data-test-question-id]')?.getAttribute('data-test-question-id')
      
      console.log('🔍 Поиск questionId:', { 
        questionId, 
        registeredHandlers: Object.keys(formatHandlersRef.current),
        hasHandler: questionId ? !!formatHandlersRef.current[questionId] : false
      })
      
      if (questionId && formatHandlersRef.current[questionId]) {
        console.log('✅ Вызываем форматтер для questionId:', questionId)
        // Вызываем улучшение через форматтер
        formatHandlersRef.current[questionId]('magic-wand')
      } else {
        console.error('❌ QuestionId не найден или форматтер не зарегистрирован', { 
          questionId, 
          handlers: Object.keys(formatHandlersRef.current),
          activeElement: activeElement.tagName,
          parent: textarea.closest('[data-question-id]')?.getAttribute('data-question-id')
        })
        alert('Ошибка: не удалось найти активный вопрос. Убедитесь, что вы находитесь в поле вопроса или ответа.')
      }
    } else {
      console.error('❌ Активный элемент не является textarea', { activeElement: activeElement?.tagName })
      alert('Выберите поле для улучшения текста')
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
          // Сохраняем временные вопросы перед очисткой
          const tempQuestions = getTempQuestions(testId)
          console.log(`Найдено ${tempQuestions.length} временных вопросов перед загрузкой из БД`)
          
          // Очищаем только сохраненные вопросы, оставляя временные
          clearSavedQuestionsFromLocalStorage(testId)
          
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
              
              // Временные вопросы уже сохранены выше, теперь можем очистить сохраненные
              
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

              // Объединяем вопросы из БД с временными вопросами
              const allQuestions: Question[] = [...dbQuestions]
              
              // Добавляем временные вопросы
              for (const tempQuestion of tempQuestions) {
                allQuestions.push({
                  id: tempQuestion.id,
                  type: tempQuestion.type,
                  question: tempQuestion.data.question || ''
                })
              }
              
              setQuestions(allQuestions)
              setOriginalQuestionsFromDB([...dbQuestions]) // Сохраняем исходные вопросы из БД
              if (allQuestions.length > 0 && !selectedQuestionId) {
                setSelectedQuestionId(allQuestions[0].id)
              }
            } else {
              // Если вопросов в БД нет, показываем только временные вопросы
              const tempOnlyQuestions: Question[] = []
              
              // Добавляем временные вопросы
              for (const tempQuestion of tempQuestions) {
                tempOnlyQuestions.push({
                  id: tempQuestion.id,
                  type: tempQuestion.type,
                  question: tempQuestion.data.question || ''
                })
              }
              
              setQuestions(tempOnlyQuestions)
              setOriginalQuestionsFromDB([])
              if (tempOnlyQuestions.length > 0 && !selectedQuestionId) {
                setSelectedQuestionId(tempOnlyQuestions[0].id)
              }
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
      
      // Сохраняем временные вопросы перед перезагрузкой
      const tempQuestions = getTempQuestions(testId)
      console.log(`Найдено ${tempQuestions.length} временных вопросов перед перезагрузкой`)
      
      const response = await fetch(`/api/teacher/tests/${testId}/questions`)
      const result = await response.json()

      if (result.success && result.data) {
        console.log(`Перезагружено ${result.data.length} вопросов из БД для теста ${testId}`)
        
        // Очищаем только сохраненные вопросы, оставляя временные
        clearSavedQuestionsFromLocalStorage(testId)
        
        const dbQuestions: Question[] = []
        
        // Сохраняем каждый вопрос из БД в localStorage и добавляем в список
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

        // Объединяем вопросы из БД с временными вопросами
        const allQuestions: Question[] = [...dbQuestions]
        
        // Добавляем временные вопросы
        for (const tempQuestion of tempQuestions) {
          allQuestions.push({
            id: tempQuestion.id,
            type: tempQuestion.type,
            question: tempQuestion.data.question || ''
          })
        }

        setQuestions(allQuestions)
        setOriginalQuestionsFromDB([...dbQuestions]) // Обновляем исходные вопросы
        
        // Если был выбранный вопрос, но его больше нет, сбрасываем выбор
        if (selectedQuestionId && !allQuestions.find(q => q.id === selectedQuestionId)) {
          setSelectedQuestionId(allQuestions.length > 0 ? allQuestions[0].id : null)
        }
      } else {
        // Если вопросов нет в БД, показываем только временные вопросы
        const tempOnlyQuestions: Question[] = []
        
        // Добавляем временные вопросы
        for (const tempQuestion of tempQuestions) {
          tempOnlyQuestions.push({
            id: tempQuestion.id,
            type: tempQuestion.type,
            question: tempQuestion.data.question || ''
          })
        }
        
        setQuestions(tempOnlyQuestions)
        setOriginalQuestionsFromDB([])
        if (tempOnlyQuestions.length > 0 && selectedQuestionId && !tempOnlyQuestions.find(q => q.id === selectedQuestionId)) {
          setSelectedQuestionId(tempOnlyQuestions[0].id)
        }
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
      
      // Сохраняем временные вопросы перед загрузкой
      const tempQuestions = getTempQuestions(testId)
      console.log(`Найдено ${tempQuestions.length} временных вопросов перед загрузкой из БД`)
      
      const response = await fetch(`/api/teacher/tests/${testId}/questions`)
      const result = await response.json()

      if (result.success && result.data) {
        console.log(`Загружаем ${result.data.length} вопросов из БД для теста ${testId}`)
        
        // Очищаем только сохраненные вопросы, оставляя временные
        clearSavedQuestionsFromLocalStorage(testId)
        
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

        // Объединяем вопросы из БД с временными вопросами
        const allQuestions: Question[] = [...dbQuestions]
        
        // Добавляем временные вопросы
        for (const tempQuestion of tempQuestions) {
          allQuestions.push({
            id: tempQuestion.id,
            type: tempQuestion.type,
            question: tempQuestion.data.question || ''
          })
        }

        setQuestions(allQuestions)
        setOriginalQuestionsFromDB([...dbQuestions]) // Сохраняем исходные вопросы из БД
        if (allQuestions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(allQuestions[0].id)
        }
      } else {
        // Если вопросов нет в БД, показываем только временные вопросы
        const tempOnlyQuestions: Question[] = []
        
        // Добавляем временные вопросы
        for (const tempQuestion of tempQuestions) {
          tempOnlyQuestions.push({
            id: tempQuestion.id,
            type: tempQuestion.type,
            question: tempQuestion.data.question || ''
          })
        }
        
        setQuestions(tempOnlyQuestions)
        setOriginalQuestionsFromDB([])
        if (tempOnlyQuestions.length > 0 && !selectedQuestionId) {
          setSelectedQuestionId(tempOnlyQuestions[0].id)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки вопросов из БД:', error)
    }
  }

  // Функция для проверки, изменился ли вопрос
  const isQuestionModified = (question: Question, questionData: any) => {
    // Для новых вопросов всегда считаем измененными
    if (isTempId(question.id)) {
      return true
    }

    // Ищем исходный вопрос в БД
    const originalQuestion = originalQuestionsFromDB.find(q => q.id === question.id)
    if (!originalQuestion) {
      return true // Если не найден в исходных данных, считаем измененным
    }

    // Сравниваем основные поля
    if (questionData.question?.trim() !== originalQuestion.question?.trim()) {
      return true
    }

    // Сравниваем баллы и время
    if ((questionData.points || 1) !== (originalQuestion.points || 1)) {
      return true
    }

    if ((questionData.timeLimit || 60) !== (originalQuestion.timeLimit || 60)) {
      return true
    }

    // Сравниваем изображение
    if ((questionData.imageUrl || '') !== (originalQuestion.photoUrl || '')) {
      return true
    }

    // Сравниваем ответы
    const currentAnswers = questionData.answers?.filter((a: any) => a.value && a.value.trim()) || []
    const originalAnswers = originalQuestion.answerVariants || []

    if (currentAnswers.length !== originalAnswers.length) {
      return true
    }

    for (let i = 0; i < currentAnswers.length; i++) {
      const current = currentAnswers[i]
      const original = originalAnswers[i]
      
      if (current.value?.trim() !== original.value?.trim()) {
        return true
      }
      
      if (current.isCorrect !== original.isCorrect) {
        return true
      }
    }

    return false // Вопрос не изменился
  }

  // Проверка валидности всех вопросов (есть ли правильный ответ)
  const validateAllQuestions = (): boolean => {
    if (questions.length === 0) return true
    
    // Если есть ошибки валидации, кнопка должна быть отключена
    if (Object.keys(questionValidationErrors).length > 0) {
      return false
    }
    
    for (const question of questions) {
      const questionData = loadQuestionDraft(question.id, question.type)
      if (!questionData) continue
      
      const validAnswers = questionData.answers?.filter(a => a.value && a.value.trim()) || []
      if (validAnswers.length > 0) {
        const hasCorrectAnswer = validAnswers.some(a => a.isCorrect)
        if (!hasCorrectAnswer) {
          return false // Найден вопрос без правильного ответа
        }
      }
    }
    
    return true // Все вопросы валидны
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

    // Очищаем предыдущие ошибки валидации
    setQuestionValidationErrors({})
    
    // Сначала проверяем все вопросы на валидность
    const validationErrorsMap: Record<string, string> = {}
    let hasValidationErrors = false

    for (const question of questions) {
      const questionData = loadQuestionDraft(question.id, question.type)
      
      if (!questionData) {
        const questionNumber = questions.findIndex(q => q.id === question.id) + 1
        validationErrorsMap[question.id] = `Вопрос ${questionNumber}: Данные вопроса не найдены`
        hasValidationErrors = true
        continue
      }

      const questionNumber = questions.findIndex(q => q.id === question.id) + 1
      
      if (!questionData.question || !questionData.question.trim()) {
        validationErrorsMap[question.id] = `Вопрос ${questionNumber}: Текст вопроса не заполнен`
        hasValidationErrors = true
        continue
      }

      const validAnswers = questionData.answers?.filter(a => a.value && a.value.trim()) || []
      if (validAnswers.length < 2) {
        validationErrorsMap[question.id] = `Вопрос ${questionNumber}: Необходимо минимум 2 варианта ответа`
        hasValidationErrors = true
        continue
      }

      const hasCorrectAnswer = validAnswers.some(a => a.isCorrect)
      if (!hasCorrectAnswer) {
        validationErrorsMap[question.id] = `Вопрос ${questionNumber}: Не выбран правильный ответ`
        hasValidationErrors = true
        continue
      }
    }

    // Если есть ошибки валидации, показываем их и не сохраняем
    if (hasValidationErrors) {
      setQuestionValidationErrors(validationErrorsMap)
      // Прокручиваем к первому вопросу с ошибкой
      const firstErrorQuestionId = Object.keys(validationErrorsMap)[0]
      if (firstErrorQuestionId) {
        const errorElement = document.querySelector(`[data-question-id="${firstErrorQuestionId}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      showToast(getText('tests.validationErrors', 'Исправьте ошибки в вопросах'), 'error')
      return
    }

    setIsSubmitting(true)
    let successCount = 0
    let newQuestionsCount = 0
    let updatedQuestionsCount = 0
    let errorCount = 0
    let validationErrors: string[] = []

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

      // Сохраняем каждый вопрос (валидация уже выполнена выше)
      for (const question of questions) {
        try {
          // Определяем, новый это вопрос или существующий
          const isNewQuestion = isTempId(question.id)
          
          // Получаем данные вопроса из localStorage
          const questionData = loadQuestionDraft(question.id, question.type)
          
          if (!questionData) {
            console.warn(`Данные вопроса ${question.id} не найдены в localStorage после валидации`)
            // Если данные не найдены после валидации, это ошибка
            // Валидация должна была проверить наличие данных
            errorCount++
            continue
          }
          
          // Проверяем, изменился ли вопрос
          const isModified = isQuestionModified(question, questionData)
          
          // Если вопрос не новый и не изменился, пропускаем его
          if (!isNewQuestion && !isModified) {
            console.log(`Вопрос ${question.id} не изменился, пропускаем`)
            continue
          }
          
          // Получаем валидные ответы
          const validAnswers = questionData.answers?.filter(a => a.value && a.value.trim()) || []
          
          console.log(`Сохраняем вопрос ${question.id}, новый: ${isNewQuestion}, изменен: ${isModified}`)
          
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
            if (isNewQuestion) {
              newQuestionsCount++
            } else {
              updatedQuestionsCount++
            }
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

      // Если есть ошибки, показываем их
      if (errorCount > 0) {
        // Показываем конкретные ошибки валидации
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors.join('\n')
          showToast(errorMessage, 'error')
        } else {
          showToast(
            getText('tests.saveQuestionsError', `Ошибка при сохранении вопросов: ${errorCount}`),
            'error'
          )
        }
        setIsSubmitting(false)
        return
      }

      // Если нет ошибок, показываем успешное сообщение
      if (successCount > 0 || questionsToDelete.length > 0) {
        let message = ''
        const messageParts = []
        
        if (newQuestionsCount > 0) {
          messageParts.push(`Создано вопросов: ${newQuestionsCount}`)
        }
        
        if (updatedQuestionsCount > 0) {
          messageParts.push(`Изменено вопросов: ${updatedQuestionsCount}`)
        }
        
        if (questionsToDelete.length > 0) {
          messageParts.push(`Удалено вопросов: ${questionsToDelete.length}`)
        }
        
        // Если нет изменений, но и нет ошибок, показываем сообщение об успехе
        if (messageParts.length === 0) {
          message = getText('tests.questionsSaved', 'Вопросы сохранены успешно')
        } else {
          message = messageParts.join(', ')
        }
        
        showToast(message, 'success')
        setHasUnsavedChanges(false)
        
        // Очищаем ошибки валидации после успешного сохранения
        setQuestionValidationErrors({})
        
        // Очищаем localStorage после успешного сохранения
        console.log('Очищаем localStorage после успешного сохранения вопросов')
        clearTestFromLocalStorage(testId)
        
        // Перезагружаем актуальные данные из БД после успешного сохранения
        console.log('Вопросы успешно сохранены/удалены, перезагружаем из БД')
        await reloadQuestionsFromDB()
        
        // Принудительно обновляем страницу для гарантии отображения актуальных данных
        window.location.reload()
      } else {
        // Если нет изменений и нет ошибок, просто показываем сообщение
        showToast(getText('tests.noChanges', 'Нет изменений для сохранения'), 'info')
        setIsSubmitting(false)
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
                      onAiLoadingChange={(questionId, isLoading) => {
                        setAiLoadingStates(prev => ({
                          ...prev,
                          [questionId]: isLoading
                        }))
                      }}
                      validationError={questionValidationErrors[question.id] || null}
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
                disabled={isSubmitting || isTempId(testId) || !validateAllQuestions()}
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
            onSaveSelection={handleSaveSelection}
            onExplainQuestion={handleExplainQuestion}
            isAiLoading={selectedQuestionId ? (aiLoadingStates[selectedQuestionId] || false) : false || isAiConverting}
          />
          
          {/* Скрытый input для выбора изображения */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageFileSelected}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </TeacherLayout>
  )
}