'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'
import RadioButton from '@/components/ui/RadioButton'
import Tooltip from '@/components/ui/Tooltip'
import TestEditorField from '@/components/teacher/TestEditorField'
import LatexPreviewModal from '@/components/teacher/LatexPreviewModal'
import { useTranslation } from '@/hooks/useTranslation'
import { useAI } from '@/hooks/useAI'
import { 
  loadQuestionDraft, 
  saveQuestionDraft, 
  type QuestionType, 
  type QuestionData 
} from '@/lib/test-storage'

interface QuestionEditorProps {
  questionId: string
  testId: string
  testLanguage: 'ru' | 'kg'
  questionType: QuestionType
  questionNumber?: number
  onQuestionUpdate?: (questionId: string, data: { question: string; type: QuestionType }) => void
  isShowingExplanation?: boolean
  aiExplanation?: string
  isPreviewMode?: boolean
  onFormatRegister?: (handler: (format: string) => void) => void
  onFocus?: () => void
  onRegenerateExplanation?: () => void
  onAiLoadingChange?: (questionId: string, isLoading: boolean) => void
  onShowToast?: (message: string, variant: 'success' | 'error' | 'warning' | 'info', title?: string) => void
  validationError?: string | null
  isRegeneratingExplanation?: boolean
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questionId,
  testId,
  testLanguage,
  questionType,
  questionNumber,
  onQuestionUpdate,
  isShowingExplanation = false,
  aiExplanation = '',
  isPreviewMode: externalPreviewMode = false,
  onFormatRegister,
  onFocus,
  onRegenerateExplanation,
  onAiLoadingChange,
  onShowToast,
  validationError: externalValidationError,
  isRegeneratingExplanation = false
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [questionText, setQuestionText] = useState('')
  
  // Определяем минимальное количество ответов в зависимости от типа вопроса
  const getMinAnswersCountForType = (type: string) => {
    if (type === 'math1') {
      return 2
    }
    if (type === 'math2') {
      return 5
    }
      if (type === 'standard') {
        return 4
      }
      return 2 // analogy, rac, grammar - минимум 2
  }
  
  // Определяем максимальное количество ответов в зависимости от типа вопроса
  const getMaxAnswersCountForType = (type: string) => {
    if (type === 'math1') {
      return 2 // Строго 2 ответа
    }
    if (type === 'math2') {
      return 5 // Строго 5 ответов
    }
    if (type === 'analogy' || type === 'rac' || type === 'grammar') {
      return 4 // Строго 4 ответа
    }
    return 10 // standard - до 10 ответов
  }
  
    // Определяем начальное количество ответов в зависимости от типа вопроса
    const getInitialAnswersCount = () => {
      if (questionType === 'standard') {
        return 4 // По умолчанию 4 варианта для standard
      }
      return getMaxAnswersCountForType(questionType)
    }
  
  const [answers, setAnswers] = useState<Array<{ value: string; isCorrect: boolean }>>(
    Array.from({ length: getInitialAnswersCount() }, () => ({ value: '', isCorrect: false }))
  )
  const [points, setPoints] = useState(1)
  const [timeLimit, setTimeLimit] = useState(60)
  const [imageUrl, setImageUrl] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editableExplanation, setEditableExplanation] = useState('')
  
  // Состояние для версий текста (original/improved)
  const [textVersions, setTextVersions] = useState<{
    question?: { original: string; improved: string; isShowingImproved: boolean }
    answers?: Record<number, { original: string; improved: string; isShowingImproved: boolean }>
  }>({})
  
  // Используем внешний isPreviewMode, если передан
  const isPreviewMode = externalPreviewMode
  
  // Синхронизируем editableExplanation с aiExplanation
  useEffect(() => {
    if (aiExplanation) {
      setEditableExplanation(aiExplanation)
    }
  }, [aiExplanation])
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 })
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageToLatexInputRef = useRef<HTMLInputElement>(null)
  
  // Состояния для resize
  const [questionHeight, setQuestionHeight] = useState(150)
  const [answerHeights, setAnswerHeights] = useState<Record<number, number>>({})
  const [isResizing, setIsResizing] = useState(false)
  const [resizingField, setResizingField] = useState<{ type: 'question' | 'answer', index?: number } | null>(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)
  
  // AI hooks - с проверкой на существование
  const [aiLoading, setAiLoading] = useState(false)
  const aiHook = typeof window !== 'undefined' ? useAI() : null
  const improveText = aiHook?.improveText
  const convertImageToLatex = aiHook?.convertImageToLatex
  
  // Состояние для модального окна предпросмотра LaTeX
  const [isLatexPreviewOpen, setIsLatexPreviewOpen] = useState(false)
  const [convertedLatexCode, setConvertedLatexCode] = useState('')
  const [latexInsertPosition, setLatexInsertPosition] = useState({ start: 0, end: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Обработчик начала изменения размера
  const handleResizeStart = (e: React.MouseEvent, type: 'question' | 'answer', index?: number) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizingField({ type, index })
    startYRef.current = e.clientY
    startHeightRef.current = type === 'question' ? questionHeight : (answerHeights[index!] || 60)
  }
  
  // Отслеживание движения мыши при изменении размера
  useEffect(() => {
    if (!isResizing || !resizingField) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startYRef.current
      const newHeight = Math.max(60, Math.min(500, startHeightRef.current + deltaY))
      
      if (resizingField.type === 'question') {
        setQuestionHeight(newHeight)
      } else if (resizingField.type === 'answer' && resizingField.index !== undefined) {
        setAnswerHeights(prev => ({ ...prev, [resizingField.index!]: newHeight }))
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizingField(null)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizingField, answerHeights])

  // Загрузка данных вопроса
  useEffect(() => {
    if (!mounted || !questionId) return

      const loadedData = loadQuestionDraft(questionId, questionType)
      if (loadedData) {
        // Загружаем версии текста, если есть
        if (loadedData.textVersions) {
          setTextVersions(loadedData.textVersions)
          
          // Восстанавливаем текущие значения из версий
          if (loadedData.textVersions.question) {
            const questionVersion = loadedData.textVersions.question
            setQuestionText(questionVersion.isShowingImproved ? questionVersion.improved : questionVersion.original)
          } else {
            setQuestionText(loadedData.question || '')
          }
          
            if (loadedData.textVersions.answers) {
              const defaultAnswersCount = getInitialAnswersCount()
            const loadedAnswers = loadedData.answers && loadedData.answers.length > 0 
              ? loadedData.answers 
              : Array.from({ length: defaultAnswersCount }, () => ({ value: '', isCorrect: false }))
            
            setAnswers(loadedAnswers.map((answer, index) => {
              const answerVersion = loadedData.textVersions?.answers?.[index]
              if (answerVersion) {
                return {
                  ...answer,
                  value: answerVersion.isShowingImproved ? answerVersion.improved : answerVersion.original
                }
              }
              return answer
            }))
            } else {
              const defaultAnswersCount = getInitialAnswersCount()
            setAnswers(loadedData.answers && loadedData.answers.length > 0 
              ? loadedData.answers 
              : Array.from({ length: defaultAnswersCount }, () => ({ value: '', isCorrect: false }))
            )
          }
          } else {
            setQuestionText(loadedData.question || '')
            const defaultAnswersCount = getInitialAnswersCount()
          setAnswers(loadedData.answers && loadedData.answers.length > 0 
            ? loadedData.answers 
            : Array.from({ length: defaultAnswersCount }, () => ({ value: '', isCorrect: false }))
          )
        }
        
        setPoints(loadedData.points || 1)
        setTimeLimit(loadedData.timeLimit || 60)
        setImageUrl(loadedData.imageUrl || '')
        
        // Загружаем AI объяснение
        if (loadedData.explanation_ai) {
          setEditableExplanation(loadedData.explanation_ai)
        }
        } else {
        // Если данных нет, инициализируем с правильным количеством ответов
        const defaultAnswersCount = getInitialAnswersCount()
      setAnswers(Array.from({ length: defaultAnswersCount }, () => ({ value: '', isCorrect: false })))
    }
  }, [mounted, questionId, questionType])

  // Обновляем количество ответов при изменении типа вопроса
  useEffect(() => {
    if (!mounted) return
    
    // Для типов с фиксированным количеством ответов используем максимальное количество
    // Для standard используем начальное количество (4)
    const requiredCount = questionType === 'standard' ? getInitialAnswersCount() : getMaxAnswersCountForType(questionType)
    
    // Если текущее количество ответов не соответствует требуемому, обновляем
    if (answers.length !== requiredCount) {
      if (answers.length < requiredCount) {
        // Добавляем недостающие ответы
        const newAnswers = [...answers]
        while (newAnswers.length < requiredCount) {
          newAnswers.push({ value: '', isCorrect: false })
        }
        setAnswers(newAnswers)
      } else {
        // Удаляем лишние ответы (но не меньше минимума)
        const newAnswers = answers.slice(0, requiredCount)
        // Если удалили правильный ответ, делаем первый правильным
        const hasCorrect = newAnswers.some(a => a.isCorrect)
        if (!hasCorrect && newAnswers.length > 0) {
          newAnswers[0].isCorrect = true
        }
        setAnswers(newAnswers)
      }
    }
  }, [questionType, mounted])

  // Автосохранение при изменении
  useEffect(() => {
    if (!mounted || !questionId) return

    const saveTimer = setTimeout(() => {
      saveQuestionDraft(questionId, questionType, {
        question: questionText,
        answers,
        points,
        timeLimit,
        imageUrl,
        language: testLanguage,
        explanation_ai: editableExplanation || aiExplanation || undefined
      })

      // Уведомляем родителя об обновлении
      if (onQuestionUpdate) {
        onQuestionUpdate(questionId, {
          question: questionText,
          type: questionType
        })
      }
    }, 500)

    return () => clearTimeout(saveTimer)
  }, [mounted, questionId, questionType, questionText, answers, points, timeLimit, imageUrl, testLanguage, editableExplanation, aiExplanation, onQuestionUpdate])


  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  // Функция для получения метки ответа (А, Б, В, Г, Д)
  const getAnswerLabel = (index: number) => {
    const labels = ['А', 'Б', 'В', 'Г', 'Д']
    return labels[index] || String(index + 1)
  }

  // Функция для определения активного форматирования в выделенном тексте
  const getActiveFormats = (text: string, start: number, end: number) => {
    const selectedText = text.substring(start, end)
    const formats = {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false
    }

    // Проверяем, окружен ли выделенный текст маркерами форматирования
    const textBefore = text.substring(Math.max(0, start - 10), start)
    const textAfter = text.substring(end, Math.min(text.length, end + 10))

    // Жирный: **текст**
    if (textBefore.endsWith('**') && textAfter.startsWith('**')) {
      formats.bold = true
    }

    // Курсив: *текст* (но не **текст**)
    if (textBefore.endsWith('*') && textAfter.startsWith('*') && 
        !textBefore.endsWith('**') && !textAfter.startsWith('**')) {
      formats.italic = true
    }

    // Зачеркнутый: ~~текст~~
    if (textBefore.endsWith('~~') && textAfter.startsWith('~~')) {
      formats.strikethrough = true
    }

    // Подчеркнутый: <u>текст</u>
    if (textBefore.endsWith('<u>') && textAfter.startsWith('</u>')) {
      formats.underline = true
    }

    return formats
  }

  // AI улучшение текста
  const handleMagicWand = React.useCallback(async (fieldType: 'question' | 'answer' = 'question', answerIndex?: number) => {
    console.log('🔮 handleMagicWand вызван', { fieldType, answerIndex, questionId })
    
    let textarea: HTMLTextAreaElement | null = null
    let currentText = ''
    let start = 0
    let end = 0

    if (fieldType === 'question') {
      textarea = questionTextareaRef.current
      if (!textarea) {
        console.error('❌ textarea для вопроса не найден')
        onShowToast?.('Ошибка: поле вопроса не найдено', 'error', 'Ошибка!')
        return
      }
      start = textarea.selectionStart
      end = textarea.selectionEnd
      currentText = questionText
      console.log('📝 Вопрос:', { start, end, textLength: currentText.length })
    } else if (fieldType === 'answer' && answerIndex !== undefined) {
      // Находим textarea для ответа - используем более надежный селектор
      const container = document.querySelector(`[data-question-id="${questionId}"]`)
      const answerTextarea = container?.querySelector(`textarea[data-answer-index="${answerIndex}"]`) as HTMLTextAreaElement
      
      if (!answerTextarea) {
        console.error('❌ textarea для ответа не найден', { answerIndex, questionId })
        onShowToast?.(`Ошибка: поле ответа ${answerIndex + 1} не найдено`, 'error', 'Ошибка!')
        return
      }
      textarea = answerTextarea
      start = textarea.selectionStart
      end = textarea.selectionEnd
      currentText = answers[answerIndex]?.value || ''
      console.log('📝 Ответ:', { answerIndex, start, end, textLength: currentText.length })
    }

    if (!textarea) {
      console.error('❌ textarea не найден')
      return
    }

    const selectedText = currentText.substring(start, end).trim()
    console.log('✂️ Выделенный текст:', { 
      selectedText: selectedText.substring(0, 100), 
      length: selectedText.length,
      start,
      end,
      currentTextLength: currentText.length,
      rawSelection: currentText.substring(start, end)
    })

    if (!selectedText || start === end) {
      onShowToast?.(
        getText('testEditor.errors.selectTextToImprove', 'Выделите текст, который нужно улучшить'),
        'warning',
        'Внимание!'
      )
      return
    }

    if (!improveText) {
      console.error('❌ improveText функция недоступна')
      onShowToast?.(
        getText('testEditor.errors.aiNotAvailable', 'AI функция недоступна. Проверьте настройки OpenAI API.'),
        'error',
        'Ошибка!'
      )
      return
    }
    
    console.log('✅ Начинаем улучшение текста...')

    console.log('🔄 Устанавливаем состояние загрузки для questionId:', questionId)
    setAiLoading(true)
    onAiLoadingChange?.(questionId, true)
    try {
      console.log('🤖 Вызываем AI для улучшения текста...', { selectedText: selectedText.substring(0, 50), language: testLanguage })
      // Вызываем AI для улучшения текста
      const improvedText = await improveText(selectedText, testLanguage)
      console.log('✅ Текст улучшен:', { improvedText: improvedText.substring(0, 50) })

      // Сохраняем оригинальную версию
      const originalText = currentText
      const newText = currentText.substring(0, start) + improvedText + currentText.substring(end)

      if (fieldType === 'question') {
        // Сохраняем версии для вопроса
        setTextVersions(prev => ({
          ...prev,
          question: {
            original: originalText,
            improved: newText,
            isShowingImproved: true
          }
        }))
        setQuestionText(newText)
      } else if (fieldType === 'answer' && answerIndex !== undefined) {
        // Сохраняем версии для ответа
        setTextVersions(prev => ({
          ...prev,
          answers: {
            ...prev.answers,
            [answerIndex]: {
              original: originalText,
              improved: newText,
              isShowingImproved: true
            }
          }
        }))
        setAnswers(prev => prev.map((a, i) => 
          i === answerIndex ? { ...a, value: newText } : a
        ))
      }

      // Сохраняем версии в localStorage
      if (typeof window !== 'undefined' && questionType) {
        const existingData = loadQuestionDraft(questionId, questionType)
        const questionData: QuestionData = existingData || {
          question: questionText,
          answers: answers,
          points: points,
          timeLimit: timeLimit,
          textVersions: {}
        }
        questionData.textVersions = {
          ...textVersions,
          ...(fieldType === 'question' ? { question: { original: originalText, improved: newText, isShowingImproved: true } } : {}),
          ...(fieldType === 'answer' && answerIndex !== undefined ? {
            answers: {
              ...textVersions.answers,
              [answerIndex]: { original: originalText, improved: newText, isShowingImproved: true }
            }
          } : {})
        }
        // Сохраняем также AI объяснение
        questionData.explanation_ai = editableExplanation || aiExplanation || existingData?.explanation_ai
        saveQuestionDraft(questionId, questionType, questionData)
      }

      // Восстанавливаем фокус и позицию курсора
      setTimeout(() => {
        if (textarea) {
          textarea.focus()
          const newPosition = start + improvedText.length
          textarea.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    } catch (error) {
      console.error('❌ Ошибка улучшения текста:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      onShowToast?.(
        `${getText('testEditor.errors.improvementError', 'Ошибка при улучшении текста')}: ${errorMessage}`,
        'error',
        'Ошибка!'
      )
    } finally {
      console.log('🔄 Сбрасываем состояние загрузки для questionId:', questionId)
      setAiLoading(false)
      onAiLoadingChange?.(questionId, false)
      console.log('🏁 Завершено улучшение текста')
    }
  }, [questionText, answers, questionType, questionId, textVersions, points, timeLimit, improveText, testLanguage, onAiLoadingChange])

  // Состояние для сохранения выделения
  const [savedTextareaSelection, setSavedTextareaSelection] = useState<{
    textarea: HTMLTextAreaElement | null
    fieldType: 'question' | 'answer' | null
    answerIndex: number | null
  } | null>(null)

  // Обработчики форматирования текста
  const handleFormat = React.useCallback((format: string) => {
    // Если это вставка текста (для LaTeX формул)
    if (format.startsWith('insert-text:')) {
      try {
        const jsonValue = format.substring('insert-text:'.length)
        const newValue = JSON.parse(jsonValue)
        console.log('📝 Вставка текста в вопрос:', newValue.substring(0, 50))
        setQuestionText(newValue)
        
        // Обновляем textarea и триггерим события
        if (questionTextareaRef.current) {
          questionTextareaRef.current.value = newValue
          const inputEvent = new Event('input', { bubbles: true })
          const changeEvent = new Event('change', { bubbles: true })
          questionTextareaRef.current.dispatchEvent(inputEvent)
          questionTextareaRef.current.dispatchEvent(changeEvent)
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга JSON при вставке текста:', error)
        // Fallback: используем как есть (для обратной совместимости)
        const newValue = format.substring('insert-text:'.length)
        setQuestionText(newValue)
        if (questionTextareaRef.current) {
          questionTextareaRef.current.value = newValue
        }
      }
      return
    }
    
    // Если это вставка текста в ответ
    if (format.startsWith('insert-answer-text:')) {
      try {
        const afterPrefix = format.substring('insert-answer-text:'.length)
        const colonIndex = afterPrefix.indexOf(':')
        if (colonIndex > 0) {
          const answerIndex = parseInt(afterPrefix.substring(0, colonIndex))
          const jsonValue = afterPrefix.substring(colonIndex + 1)
          const newValue = JSON.parse(jsonValue)
          
          console.log('📝 Вставка текста в ответ:', answerIndex, newValue.substring(0, 50))
          
          setAnswers(prev => prev.map((a, i) => 
            i === answerIndex ? { ...a, value: newValue } : a
          ))
          
          // Обновляем textarea
          const container = document.querySelector(`[data-question-id="${questionId}"]`)
          const answerTextarea = container?.querySelector(`textarea[data-answer-index="${answerIndex}"]`) as HTMLTextAreaElement
          if (answerTextarea) {
            answerTextarea.value = newValue
            const inputEvent = new Event('input', { bubbles: true })
            const changeEvent = new Event('change', { bubbles: true })
            answerTextarea.dispatchEvent(inputEvent)
            answerTextarea.dispatchEvent(changeEvent)
          }
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга JSON при вставке текста в ответ:', error)
      }
      return
    }
    
    // Если это улучшение текста через Magic Wand
    if (format === 'magic-wand') {
      console.log('✨ Magic Wand вызван через handleFormat')
      
      // Сначала пытаемся использовать сохраненное выделение
      let textarea: HTMLTextAreaElement | null = null
      let fieldType: 'question' | 'answer' | null = null
      let answerIndex: number | null = null
      
      if (savedTextareaSelection && savedTextareaSelection.textarea) {
        textarea = savedTextareaSelection.textarea
        fieldType = savedTextareaSelection.fieldType
        answerIndex = savedTextareaSelection.answerIndex
        console.log('💾 Используем сохраненное выделение')
      } else {
        // Fallback: ищем активный элемент
      const activeElement = document.activeElement
      if (activeElement && activeElement.tagName === 'TEXTAREA') {
          textarea = activeElement as HTMLTextAreaElement
        const isQuestionTextarea = textarea === questionTextareaRef.current
        const answerIndexAttr = textarea.getAttribute('data-answer-index')
          answerIndex = answerIndexAttr !== null ? parseInt(answerIndexAttr) : null
          fieldType = isQuestionTextarea ? 'question' : (answerIndex !== null ? 'answer' : null)
          console.log('📋 Используем активный элемент')
        }
      }
      
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        
        console.log('📋 Определение типа поля:', { 
          fieldType, 
          answerIndex, 
          selectionStart: start, 
          selectionEnd: end,
          hasSelection: start !== end
        })
        
        // Проверяем, есть ли выделение
        if (start === end) {
          onShowToast?.('Выделите текст, который нужно улучшить', 'warning', 'Внимание!')
          setSavedTextareaSelection(null)
          return
        }
        
        if (fieldType === 'question') {
          console.log('📝 Обрабатываем вопрос')
          handleMagicWand('question')
        } else if (fieldType === 'answer' && answerIndex !== null && !isNaN(answerIndex)) {
          console.log('📝 Обрабатываем ответ', answerIndex)
          handleMagicWand('answer', answerIndex)
        } else {
          console.error('❌ Не удалось определить тип поля')
          onShowToast?.('Ошибка: не удалось определить активное поле', 'error', 'Ошибка!')
        }
        
        // Очищаем сохраненное выделение после использования
        setSavedTextareaSelection(null)
      } else {
        console.error('❌ textarea не найден')
        onShowToast?.('Выберите поле для улучшения текста', 'warning', 'Внимание!')
      }
      return
    }
    
    const textarea = questionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = questionText.substring(start, end)

    // Для формул используем старую логику (без toggle)
    if (format === 'inline-formula' || format === 'block-formula') {
      let formattedText = ''
      
      // Проверяем, что находится перед курсором (для добавления пробела между формулами)
      const textBefore = questionText.substring(0, start)
      const endsWithFormula = textBefore.length > 0 && 
        (textBefore.endsWith('$$') || textBefore.endsWith('$'))
      const needsSpace = endsWithFormula && 
        !textBefore.endsWith(' ') && 
        !textBefore.endsWith('\n')

      switch (format) {
        case 'inline-formula':
          formattedText = `${needsSpace ? ' ' : ''}$${selectedText || 'x^2'}$`
          break
        case 'block-formula':
          formattedText = `${needsSpace ? ' ' : ''}$$${selectedText || '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}'}$$`
          break
      }

      const newText = 
        questionText.substring(0, start) + 
        formattedText + 
        questionText.substring(end)
      
      setQuestionText(newText)
      
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + formattedText.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
      return
    }

    // Для текстового форматирования используем toggle-логику
    const activeFormats = getActiveFormats(questionText, start, end)
    let newText = questionText
    let newStart = start
    let newEnd = end

    switch (format) {
      case 'bold':
        if (activeFormats.bold) {
          // Убираем форматирование: удаляем ** с обеих сторон
          const beforeMarker = questionText.substring(0, start - 2)
          const afterMarker = questionText.substring(end + 2)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 2
          newEnd = end - 2
        } else {
          // Добавляем форматирование
          const formattedText = `**${selectedText || 'текст'}**`
          newText = questionText.substring(0, start) + formattedText + questionText.substring(end)
          newStart = start + 2
          newEnd = start + 2 + (selectedText || 'текст').length
        }
        break

      case 'italic':
        if (activeFormats.italic) {
          // Убираем форматирование: удаляем * с обеих сторон
          const beforeMarker = questionText.substring(0, start - 1)
          const afterMarker = questionText.substring(end + 1)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 1
          newEnd = end - 1
        } else {
          // Добавляем форматирование
          const formattedText = `*${selectedText || 'текст'}*`
          newText = questionText.substring(0, start) + formattedText + questionText.substring(end)
          newStart = start + 1
          newEnd = start + 1 + (selectedText || 'текст').length
        }
        break

      case 'strikethrough':
        if (activeFormats.strikethrough) {
          // Убираем форматирование: удаляем ~~ с обеих сторон
          const beforeMarker = questionText.substring(0, start - 2)
          const afterMarker = questionText.substring(end + 2)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 2
          newEnd = end - 2
        } else {
          // Добавляем форматирование
          const formattedText = `~~${selectedText || 'текст'}~~`
          newText = questionText.substring(0, start) + formattedText + questionText.substring(end)
          newStart = start + 2
          newEnd = start + 2 + (selectedText || 'текст').length
        }
        break

      case 'underline':
        if (activeFormats.underline) {
          // Убираем форматирование: удаляем <u> и </u>
          const beforeMarker = questionText.substring(0, start - 3)
          const afterMarker = questionText.substring(end + 4)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 3
          newEnd = end - 3
        } else {
          // Добавляем форматирование
          const formattedText = `<u>${selectedText || 'текст'}</u>`
          newText = questionText.substring(0, start) + formattedText + questionText.substring(end)
          newStart = start + 3
          newEnd = start + 3 + (selectedText || 'текст').length
        }
        break

      default:
        return
    }

    setQuestionText(newText)
    
    // Восстанавливаем фокус и выделение
    setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newStart, newEnd)
      }, 0)
  }, [questionText, handleMagicWand])

  // Сохранение выделения при каждом изменении выделения в textarea
  useEffect(() => {
    const saveSelection = (textarea: HTMLTextAreaElement, fieldType: 'question' | 'answer', answerIndex: number | null) => {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      if (start !== end) {
        setSavedTextareaSelection({
          textarea,
          fieldType,
          answerIndex
        })
        console.log('💾 Выделение сохранено', { fieldType, answerIndex, start, end })
      }
    }

    const questionTextarea = questionTextareaRef.current
    if (questionTextarea) {
      // Сохраняем выделение при каждом изменении
      const handleSelectionChange = () => {
        if (document.activeElement === questionTextarea) {
          saveSelection(questionTextarea, 'question', null)
        }
      }
      
      questionTextarea.addEventListener('mouseup', handleSelectionChange)
      questionTextarea.addEventListener('keyup', handleSelectionChange)
      questionTextarea.addEventListener('select', handleSelectionChange)

      return () => {
        questionTextarea.removeEventListener('mouseup', handleSelectionChange)
        questionTextarea.removeEventListener('keyup', handleSelectionChange)
        questionTextarea.removeEventListener('select', handleSelectionChange)
      }
    }
  }, [questionId, questionText])

  // Сохранение выделения для ответов
  useEffect(() => {
    const answerTextareas = document.querySelectorAll(`[data-question-id="${questionId}"] textarea[data-answer-index]`)
    
    const handleSelectionChange = (textarea: HTMLTextAreaElement) => {
      if (document.activeElement === textarea) {
        const answerIndexAttr = textarea.getAttribute('data-answer-index')
        const answerIndex = answerIndexAttr !== null ? parseInt(answerIndexAttr) : null
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        if (start !== end) {
          setSavedTextareaSelection({
            textarea,
            fieldType: 'answer',
            answerIndex
          })
          console.log('💾 Выделение ответа сохранено', answerIndex)
        }
      }
    }

    answerTextareas.forEach((textarea) => {
      const htmlTextarea = textarea as HTMLTextAreaElement
      htmlTextarea.addEventListener('mouseup', () => handleSelectionChange(htmlTextarea))
      htmlTextarea.addEventListener('keyup', () => handleSelectionChange(htmlTextarea))
      htmlTextarea.addEventListener('select', () => handleSelectionChange(htmlTextarea))
    })

    return () => {
      answerTextareas.forEach((textarea) => {
        const htmlTextarea = textarea as HTMLTextAreaElement
        htmlTextarea.removeEventListener('mouseup', () => handleSelectionChange(htmlTextarea))
        htmlTextarea.removeEventListener('keyup', () => handleSelectionChange(htmlTextarea))
        htmlTextarea.removeEventListener('select', () => handleSelectionChange(htmlTextarea))
      })
    }
  }, [questionId, answers])

  // Регистрация обработчика форматирования для родительского компонента
  useEffect(() => {
    if (onFormatRegister) {
      onFormatRegister(handleFormat)
    }
  }, [onFormatRegister, handleFormat, savedTextareaSelection])

  // Загрузка изображения
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert(getText('questions.form.invalidImageType', 'Неподдерживаемый тип файла'))
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert(getText('questions.form.imageTooLarge', 'Размер файла превышает 5MB'))
      return
    }

    setIsUploadingImage(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (result.success && result.url) {
        setImageUrl(result.url)
      } else {
        alert(result.error || getText('questions.form.uploadError', 'Ошибка загрузки изображения'))
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      alert(getText('questions.form.uploadError', 'Ошибка загрузки изображения'))
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  // Переключение между оригинальной и улучшенной версией
  const toggleTextVersion = (fieldType: 'question' | 'answer', answerIndex?: number) => {
    if (fieldType === 'question') {
      const questionVersion = textVersions.question
      if (!questionVersion) return

      const newIsShowingImproved = !questionVersion.isShowingImproved
      const newValue = newIsShowingImproved ? questionVersion.improved : questionVersion.original

      setTextVersions(prev => ({
        ...prev,
        question: {
          ...questionVersion,
          isShowingImproved: newIsShowingImproved
        }
      }))
      setQuestionText(newValue)

      // Сохраняем в localStorage
      if (typeof window !== 'undefined' && questionType) {
        const questionData = loadQuestionDraft(questionId, questionType)
        if (questionData) {
          if (!questionData.textVersions) questionData.textVersions = {}
          questionData.textVersions.question = {
            ...questionVersion,
            isShowingImproved: newIsShowingImproved
          }
          // Сохраняем также AI объяснение
          questionData.explanation_ai = editableExplanation || aiExplanation || questionData.explanation_ai
          saveQuestionDraft(questionId, questionType, questionData)
        }
      }
    } else if (fieldType === 'answer' && answerIndex !== undefined) {
      const answerVersion = textVersions.answers?.[answerIndex]
      if (!answerVersion) return

      const newIsShowingImproved = !answerVersion.isShowingImproved
      const newValue = newIsShowingImproved ? answerVersion.improved : answerVersion.original

      setTextVersions(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [answerIndex]: {
            ...answerVersion,
            isShowingImproved: newIsShowingImproved
          }
        }
      }))
      setAnswers(prev => prev.map((a, i) => 
        i === answerIndex ? { ...a, value: newValue } : a
      ))

      // Сохраняем в localStorage
      if (typeof window !== 'undefined' && questionType) {
        const questionData = loadQuestionDraft(questionId, questionType)
        if (questionData) {
          if (!questionData.textVersions) questionData.textVersions = {}
          if (!questionData.textVersions.answers) questionData.textVersions.answers = {}
          questionData.textVersions.answers[answerIndex] = {
            ...answerVersion,
            isShowingImproved: newIsShowingImproved
          }
          // Сохраняем также AI объяснение
          questionData.explanation_ai = editableExplanation || aiExplanation || questionData.explanation_ai
          saveQuestionDraft(questionId, questionType, questionData)
        }
      }
    }
  }

  // Конвертация изображения в LaTeX
  const handleImageToLatex = () => {
    // Открываем диалог выбора файла
    imageToLatexInputRef.current?.click()
  }

  const handleImageToLatexFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert(getText('questions.form.invalidImageType', 'Выберите изображение'))
      return
    }
    
    // Проверка размера (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(getText('questions.form.imageTooLarge', 'Размер файла превышает 5MB'))
      return
    }

    const textarea = questionTextareaRef.current
    if (!textarea) return

    if (!convertImageToLatex) {
      alert(getText('testEditor.errors.aiNotAvailable', 'AI функция недоступна'))
      return
    }

    console.log('🔄 Устанавливаем состояние загрузки для questionId:', questionId)
    setAiLoading(true)
    onAiLoadingChange?.(questionId, true)
    try {
      // Сохраняем позицию курсора
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      setLatexInsertPosition({ start, end })
      
      // Конвертируем изображение в LaTeX
      const latexCode = await convertImageToLatex(file)
      
      // Показываем модальное окно для предпросмотра и редактирования
      setConvertedLatexCode(latexCode)
      setIsLatexPreviewOpen(true)
    } catch (error) {
      console.error('Ошибка конвертации изображения:', error)
      alert(getText('questions.form.imageConversionError', 'Ошибка при конвертации изображения'))
    } finally {
      setAiLoading(false)
      onAiLoadingChange?.(questionId, false)
      // Очищаем input для возможности повторной загрузки того же файла
      if (imageToLatexInputRef.current) {
        imageToLatexInputRef.current.value = ''
      }
    }
  }

  // Обработчик подтверждения вставки LaTeX кода
  const handleLatexConfirm = (latexCode: string) => {
    const textarea = questionTextareaRef.current
    if (!textarea) return
    
    const { start, end } = latexInsertPosition
    
    // Вставляем LaTeX код в позицию курсора
    const newText = 
      questionText.substring(0, start) + 
      latexCode + 
      questionText.substring(end)
    
    setQuestionText(newText)
    
    // Восстанавливаем фокус и позицию курсора
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + latexCode.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  // Управление вариантами ответов
  const handleAddAnswer = () => {
    const maxAnswers = getMaxAnswersCountForType(questionType)
    if (answers.length < maxAnswers) {
    setAnswers([...answers, { value: '', isCorrect: false }])
    }
  }

  const handleRemoveAnswer = (index: number) => {
    // Минимальное количество ответов зависит от типа вопроса
    const minAnswers = getMinAnswersCountForType(questionType)
    
    if (answers.length > minAnswers) {
      const wasCorrect = answers[index].isCorrect
      const newAnswers = answers.filter((_, i) => i !== index)
      
      // Если удалили правильный ответ, делаем первый ответ правильным
      if (wasCorrect && newAnswers.length > 0) {
        newAnswers[0].isCorrect = true
      }
      
      setAnswers(newAnswers)
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index].value = value
    setAnswers(newAnswers)
  }

  const handleCorrectAnswerChange = (index: number) => {
    const newAnswers = answers.map((a, i) => ({ ...a, isCorrect: i === index }))
    setAnswers(newAnswers)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6" data-question-id={questionId}>
      {/* Предупреждение о неправильном ответе */}
      {externalValidationError && (
        <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm flex items-center gap-2">
          <Icons.AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{externalValidationError}</span>
        </div>
      )}
        {/* Текст вопроса или AI объяснение */}
        <div className={isShowingExplanation ? "flex flex-col h-full min-h-[500px]" : ""}>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            {isShowingExplanation ? (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="-10 -10 562 562"
                  className="text-purple-400"
                >
                  <path
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="0"
                    d="M 327.5 85.2 c -4.5 1.7 -7.5 6 -7.5 10.8 s 3 9.1 7.5 10.8 L 384 128 l 21.2 56.5 c 1.7 4.5 6 7.5 10.8 7.5 s 9.1 -3 10.8 -7.5 L 448 128 l 56.5 -21.2 c 4.5 -1.7 7.5 -6 7.5 -10.8 s -3 -9.1 -7.5 -10.8 L 448 64 L 426.8 7.5 C 425.1 3 420.8 0 416 0 s -9.1 3 -10.8 7.5 L 384 64 L 327.5 85.2 Z M 205.1 73.3 c -2.6 -5.7 -8.3 -9.3 -14.5 -9.3 s -11.9 3.6 -14.5 9.3 L 123.3 187.3 L 9.3 240 C 3.6 242.6 0 248.3 0 254.6 s 3.6 11.9 9.3 14.5 l 114.1 52.7 L 176 435.8 c 2.6 5.7 8.3 9.3 14.5 9.3 s 11.9 -3.6 14.5 -9.3 l 52.7 -114.1 l 114.1 -52.7 c 5.7 -2.6 9.3 -8.3 9.3 -14.5 s -3.6 -11.9 -9.3 -14.5 L 257.8 187.4 L 205.1 73.3 Z M 384 384 l -56.5 21.2 c -4.5 1.7 -7.5 6 -7.5 10.8 s 3 9.1 7.5 10.8 L 384 448 l 21.2 56.5 c 1.7 4.5 6 7.5 10.8 7.5 s 9.1 -3 10.8 -7.5 L 448 448 l 56.5 -21.2 c 4.5 -1.7 7.5 -6 7.5 -10.8 s -3 -9.1 -7.5 -10.8 L 448 384 l -21.2 -56.5 c -1.7 -4.5 -6 -7.5 -10.8 -7.5 s -9.1 3 -10.8 7.5 L 384 384 Z"
                  />
                </svg>
                <span>Объяснение от AI</span>
              </>
            ) : (
              questionNumber ? `Вопрос ${questionNumber}` : getText('tests.questionText', 'Текст вопроса')
            )}
          </label>
          {/* Кнопка переключения версий вопроса - показывается только если есть версии */}
          {!isShowingExplanation && textVersions.question && (
            <button
              type="button"
              onClick={() => toggleTextVersion('question')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 rounded-lg transition-colors text-xs font-medium"
              title={textVersions.question.isShowingImproved ? 'Показать оригинал' : 'Показать улучшенный'}
            >
              <Icons.ArrowLeft className="h-3.5 w-3.5" />
              <Icons.ArrowRight className="h-3.5 w-3.5 -ml-1" />
              <span>{textVersions.question.isShowingImproved ? 'Показать оригинал' : 'Показать улучшенный'}</span>
            </button>
          )}
        </div>
          
          {isShowingExplanation ? (
            // Отображение AI объяснения
            <div className="flex flex-col h-full min-h-[500px]">
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0">
                  {isPreviewMode ? (
                    // Режим предпросмотра - показываем обработанный Markdown (как для вопроса)
                    <div className="w-full px-5 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] min-h-[500px] prose prose-invert prose-sm max-w-none text-[var(--text-primary)] transition-colors overflow-y-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 text-[var(--text-primary)]" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 text-[var(--text-primary)] leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-[var(--text-primary)]" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-[var(--text-primary)]" {...props} />,
                          li: ({node, ...props}) => <li className="text-[var(--text-primary)]" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-[var(--text-primary)]" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? (
                              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-mono" {...props} />
                            ) : (
                              <code className="block p-3 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-mono overflow-x-auto" {...props} />
                            ),
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-[var(--text-primary)] my-3" {...props} />,
                        }}
                      >
                        {editableExplanation || aiExplanation || getText('testEditor.emptyExplanation', 'Объяснение отсутствует')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    // Режим редактирования - показываем textarea
                    <textarea
                      style={{ height: '500px' }}
                      className="w-full px-5 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-primary)] transition-all duration-300 ease-in-out focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] hover:border-[var(--border-primary)] resize-none text-sm font-mono"
                      value={editableExplanation || aiExplanation || ''}
                      onChange={(e) => {
                        setEditableExplanation(e.target.value)
                        // Сохраняем изменения в localStorage
                        if (typeof window !== 'undefined' && questionType) {
                          const questionData = loadQuestionDraft(questionId, questionType)
                          if (questionData) {
                            questionData.explanation_ai = e.target.value
                            saveQuestionDraft(questionId, questionType, questionData)
                          }
                        }
                      }}
                      placeholder="Введите объяснение..."
                    />
                  )}
                </div>
              </div>
              {/* Кнопка регенерации объяснения */}
              {onRegenerateExplanation && (
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={onRegenerateExplanation}
                    disabled={isRegeneratingExplanation}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${
                      isRegeneratingExplanation
                        ? 'bg-purple-600 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Icons.RefreshCw className={`h-4 w-4 ${isRegeneratingExplanation ? 'animate-spin' : ''}`} />
                    <span>
                      {isRegeneratingExplanation ? 'Генерация...' : 'Перегенерировать объяснение'}
                    </span>
                  </button>
                </div>
              )}
              {/* Баллы и время */}
              <div className="flex items-center gap-6 pt-4 mt-4 border-t border-gray-800 flex-wrap">
                <div className="flex items-center gap-3">
                  <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
                    <Icons.CircleDot className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
                    {getText('tests.points', 'Баллы')} <span className="text-red-400"> *</span>
                  </label>
                  <div className="w-16">
                    <input
                      type="number"
                      value={points || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (inputValue === '') {
                          setPoints(0)
                          return
                        }
                        const value = parseInt(inputValue) || 0
                        if (value >= 1 && value <= 5) {
                          setPoints(value)
                        } else if (value === 0 && inputValue === '0') {
                          setPoints(0)
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setPoints(Math.min(Math.max(1, value), 5))
                      }}
                      min="1"
                      max="5"
                      className="w-16 h-8 text-sm px-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] text-center transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {getText('tests.pointsHint', 'Максимум 5 баллов')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
                    <Icons.Clock className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
                    {getText('tests.timeLimit', 'Время (сек)')} <span className="text-red-400"> *</span>
                  </label>
                  <div className="w-16">
                    <input
                      type="number"
                      value={timeLimit || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (inputValue === '') {
                          setTimeLimit(0)
                          return
                        }
                        const value = parseInt(inputValue) || 0
                        if (value >= 1 && value <= 120) {
                          setTimeLimit(value)
                        } else if (value === 0 && inputValue === '0') {
                          setTimeLimit(0)
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value) || 60
                        setTimeLimit(Math.min(Math.max(1, value), 120))
                      }}
                      min="1"
                      max="120"
                      className="w-16 h-8 text-sm px-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] text-center transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {getText('tests.timeLimitHint', 'Максимум 120 секунд')}
                  </p>
                </div>
              </div>
            </div>
          ) : isPreviewMode ? (
            // Режим предпросмотра - показываем обработанный Markdown
            <div className="w-full px-5 py-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] min-h-[150px] prose prose-invert prose-sm max-w-none text-[var(--text-primary)] transition-colors">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 text-[var(--text-primary)]" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]" {...props} />,
                  p: ({node, ...props}) => <p className="mb-3 text-[var(--text-primary)] leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-[var(--text-primary)]" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-[var(--text-primary)]" {...props} />,
                  li: ({node, ...props}) => <li className="text-[var(--text-primary)]" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-[var(--text-primary)]" {...props} />,
                  code: ({node, inline, ...props}: any) => 
                    inline ? (
                      <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-mono" {...props} />
                    ) : (
                      <code className="block p-3 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-mono overflow-x-auto" {...props} />
                    ),
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 italic text-[var(--text-primary)] my-3" {...props} />,
                }}
              >
                {questionText || getText('tests.emptyQuestion', 'Текст вопроса отсутствует')}
              </ReactMarkdown>
            </div>
          ) : (
            // Режим редактирования - показываем textarea с Markdown кодом
            <div className="relative">
              <textarea
                ref={questionTextareaRef}
                style={{ height: `${questionHeight}px` }}
                className="w-full px-5 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-primary)] transition-all duration-300 ease-in-out focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] hover:border-[var(--border-primary)] resize-none text-sm font-mono"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onFocus={() => onFocus?.()}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  setCursorPosition({ start: target.selectionStart, end: target.selectionEnd })
                }}
                onKeyUp={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  setCursorPosition({ start: target.selectionStart, end: target.selectionEnd })
                }}
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  setCursorPosition({ start: target.selectionStart, end: target.selectionEnd })
                }}
                placeholder={getText('tests.questionPlaceholder', 'Введите текст вопроса...')}
              />
              {/* Resize handle */}
              <div
                className="absolute bottom-2 right-2 w-10 h-10 cursor-nwse-resize flex items-center justify-center group/resize"
                onMouseDown={(e) => handleResizeStart(e, 'question')}
              >
                <svg
                  className="w-8 h-8 text-gray-500 group-hover/resize:text-gray-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path d="M20 20L16 16M20 20L16 20M20 20L20 16" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Изображение */}
        {imageUrl && (
          <div className="relative">
            <img
              src={imageUrl}
              alt="Question"
            className="max-w-full h-auto rounded-lg border border-[var(--border-primary)]"
            />
            <button
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
            <Icons.Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        {/* Варианты ответов - скрываем при показе объяснения */}
        {!isShowingExplanation && (
        <div>
        <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] mb-3">
          <Icons.List className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
          {getText('tests.answers', 'Варианты ответов')} <span className="text-red-400"> *</span>
            </label>

        <div className="space-y-4">
            {answers.map((answer, index) => (
            <div key={index}>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <RadioButton
                    id={`answer-${questionId}-${index}`}
                    name={`correct-answer-${questionId}`}
                  checked={answer.isCorrect}
                  onChange={() => handleCorrectAnswerChange(index)}
                    label={getAnswerLabel(index)}
                />
                </div>
                <div className="flex-1">
                  {isPreviewMode ? (
                    // Режим предпросмотра - показываем обработанный Markdown
                    <div className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] min-h-[60px] prose prose-invert prose-sm max-w-none text-[var(--text-primary)] transition-colors">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-0 text-[var(--text-primary)] leading-relaxed" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-[var(--text-primary)]" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? (
                              <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-mono" {...props} />
                            ) : (
                              <code className="block p-3 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-mono overflow-x-auto" {...props} />
                            ),
                        }}
                      >
                        {answer.value || `${getText('tests.answer', 'Ответ')} ${index + 1}`}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    // Режим редактирования - показываем textarea с Markdown кодом
                    <div className="relative">
                      <textarea
                        data-answer-index={index}
                        style={{ height: `${answerHeights[index] || 60}px` }}
                        value={answer.value}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        onFocus={() => onFocus?.()}
                        placeholder={`${getText('tests.answer', 'Ответ')} ${index + 1}`}
                        className="w-full px-4 py-3 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-primary)] transition-all duration-300 ease-in-out focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] hover:border-[var(--border-primary)] resize-none text-sm font-mono"
                      />
                      {/* Кнопка переключения версий - показывается только если есть версии */}
                      {textVersions.answers?.[index] && (
                        <button
                          type="button"
                          onClick={() => toggleTextVersion('answer', index)}
                          className="absolute top-2 right-14 flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 rounded-lg transition-colors text-xs font-medium z-10"
                          title={textVersions.answers[index].isShowingImproved ? 'Показать оригинал' : 'Показать улучшенный'}
                        >
                          <Icons.ArrowLeft className="h-3.5 w-3.5" />
                          <Icons.ArrowRight className="h-3.5 w-3.5 -ml-1" />
                          <span>{textVersions.answers[index].isShowingImproved ? 'Показать оригинал' : 'Показать улучшенный'}</span>
                        </button>
                      )}
                      {/* Resize handle */}
                      <div
                        className="absolute bottom-2 right-2 w-10 h-10 cursor-nwse-resize flex items-center justify-center group/resize"
                        onMouseDown={(e) => handleResizeStart(e, 'answer', index)}
                      >
                        <svg
                          className="w-8 h-8 text-gray-500 group-hover/resize:text-gray-400 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path d="M20 20L16 16M20 20L16 20M20 20L20 16" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {/* Кнопка удаления - показываем только для standard, если больше минимального количества */}
                {questionType === 'standard' && (() => {
                  const minAnswers = getMinAnswersCountForType(questionType)
                  return answers.length > minAnswers
                })() && (
                  <Tooltip text={getText('tests.removeAnswer', 'Удалить вариант')}>
                    <button
                      onClick={() => handleRemoveAnswer(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                )}
              </div>
              </div>
            ))}
          </div>

          {/* Кнопка добавления ответа - показываем если можно добавить больше */}
          {(() => {
            const maxAnswers = getMaxAnswersCountForType(questionType)
            return answers.length < maxAnswers
          })() && (
            <button
              onClick={handleAddAnswer}
              className="mt-3 w-full px-4 py-2.5 border-2 border-dashed border-[var(--border-primary)] rounded-lg hover:border-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <Icons.Plus className="h-5 w-5" />
              <span>{getText('tests.addAnswer', 'Добавить вариант')}</span>
            </button>
          )}
        </div>
        )}

        {/* Баллы и время - скрываем при показе объяснения */}
        {!isShowingExplanation && (
      <div className="flex items-center gap-6 pt-4 border-t border-gray-800 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            <Icons.CircleDot className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
            {getText('tests.points', 'Баллы')} <span className="text-red-400"> *</span>
            </label>
          <div className="w-16">
            <input
              type="number"
              value={points || ''}
              onChange={(e) => {
                const inputValue = e.target.value
                if (inputValue === '') {
                  setPoints(0)
                  return
                }
                const value = parseInt(inputValue) || 0
                if (value >= 1 && value <= 5) {
                  setPoints(value)
                } else if (value === 0 && inputValue === '0') {
                  setPoints(0)
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 1
                setPoints(Math.min(Math.max(1, value), 5))
              }}
              min="1"
              max="5"
              className="w-16 h-8 text-sm px-1 rounded-lg border border-gray-700 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] text-center transition-colors"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
              {getText('tests.pointsHint', 'Максимум 5 баллов')}
            </p>
          </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
            <Icons.Clock className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
            {getText('tests.timeLimit', 'Время (сек)')} <span className="text-red-400"> *</span>
            </label>
          <div className="w-16">
            <input
              type="number"
              value={timeLimit || ''}
              onChange={(e) => {
                const inputValue = e.target.value
                if (inputValue === '') {
                  setTimeLimit(0)
                  return
                }
                const value = parseInt(inputValue) || 0
                if (value >= 1 && value <= 120) {
                  setTimeLimit(value)
                } else if (value === 0 && inputValue === '0') {
                  setTimeLimit(0)
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 60
                setTimeLimit(Math.min(Math.max(1, value), 120))
              }}
              min="1"
              max="120"
              className="w-16 h-8 text-sm px-1 rounded-lg border border-gray-700 bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] focus:bg-[var(--bg-tertiary)] text-center transition-colors"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            {getText('tests.timeLimitHint', 'Максимум 120 секунд')}
          </p>
        </div>
      </div>
        )}

      {/* Скрытые input для загрузки изображений */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={imageToLatexInputRef}
        onChange={handleImageToLatexFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={aiLoading}
      />

      {/* Модальное окно предпросмотра LaTeX */}
      <LatexPreviewModal
        isOpen={isLatexPreviewOpen}
        onClose={() => setIsLatexPreviewOpen(false)}
        latexCode={convertedLatexCode}
        onConfirm={handleLatexConfirm}
      />
    </div>
  )
}

export default QuestionEditor

