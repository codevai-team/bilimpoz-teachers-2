'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { Icons } from '@/components/ui/Icons'
import Input from '@/components/ui/Input'
import Select, { SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import TestToolbar from '@/components/teacher/TestToolbar'
import { useTranslation } from '@/hooks/useTranslation'
import { useAI } from '@/hooks/useAI'

interface CreateQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: QuestionFormData) => void
  isLoading?: boolean
  initialData?: QuestionFormData & { id?: string }
  mode?: 'create' | 'edit'
}

export interface QuestionFormData {
  question: string
  type_question: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'
  type_from: 'from_lesson' | 'from_teacher' | 'from_trial' | 'from_student' | 'from_mentor'
  language: 'ru' | 'kg'
  source_id: string
  points: number
  time_limit: number
  photo_url?: string
  explanation_ai?: string
  answer_variants: AnswerVariant[]
  correct_variant_index: number
}

interface AnswerVariant {
  value: string
}

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
  mode = 'create'
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

  const defaultFormData: QuestionFormData = {
    question: '',
    type_question: 'standard',
    type_from: 'from_teacher',
    language: 'ru',
    source_id: '',
    points: 1,
    time_limit: 60,
    photo_url: '',
    explanation_ai: '',
    answer_variants: [
      { value: '' },
      { value: '' },
      { value: '' },
      { value: '' }
    ],
    correct_variant_index: 0
  }

  const [formData, setFormData] = useState<QuestionFormData>(
    initialData || defaultFormData
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ start: 0, end: 0 })
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageToLatexInputRef = useRef<HTMLInputElement>(null)
  const { improveText, convertImageToLatex, isLoading: aiLoading } = useAI()

  // Обновляем formData при изменении initialData или режима
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setFormData(initialData)
      } else {
        setFormData(defaultFormData)
      }
      setErrors({})
      setIsPreviewMode(false)
    } else {
      // Сбрасываем данные при закрытии
      setFormData(defaultFormData)
      setErrors({})
      setIsPreviewMode(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, mode])

  const questionTypeOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
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
      { value: 'ru', label: t('questions.languages.ru') },
      { value: 'kg', label: t('questions.languages.kg') },
  ]
  }, [t, mounted, ready])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.question.trim()) {
      newErrors.question = getText('questions.form.questionText', 'Вопрос обязателен для заполнения')
    }

    const filledVariants = formData.answer_variants.filter(v => v.value.trim())
    if (filledVariants.length < 2) {
      newErrors.answer_variants = getText('questions.form.answerVariants', 'Необходимо заполнить минимум 2 варианта ответа')
    }

    if (formData.correct_variant_index < 0 || 
        formData.correct_variant_index >= formData.answer_variants.length ||
        !formData.answer_variants[formData.correct_variant_index]?.value.trim()) {
      newErrors.correct_variant = getText('questions.form.correctAnswer', 'Необходимо выбрать правильный вариант ответа')
    }

    if (formData.points < 1) {
      newErrors.points = getText('questions.form.points', 'Баллы должны быть больше 0')
    }

    if (formData.time_limit < 1) {
      newErrors.time_limit = getText('questions.form.timeLimit', 'Лимит времени должен быть больше 0')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // type_from всегда должен быть 'from_teacher' для вопросов, созданных преподавателем
      onSubmit({
        ...formData,
        type_from: 'from_teacher',
        source_id: '' // source_id будет установлен на сервере из текущего пользователя
      })
    }
  }

  const handleAnswerVariantChange = (index: number, value: string) => {
    const newVariants = [...formData.answer_variants]
    newVariants[index] = { value }
    setFormData({ ...formData, answer_variants: newVariants })
    if (errors.answer_variants) {
      setErrors({ ...errors, answer_variants: '' })
    }
  }

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      answer_variants: [...formData.answer_variants, { value: '' }]
    })
  }

  const handleRemoveVariant = (index: number) => {
    if (formData.answer_variants.length > 2) {
      const newVariants = formData.answer_variants.filter((_, i) => i !== index)
      setFormData({
        ...formData,
        answer_variants: newVariants,
        correct_variant_index: formData.correct_variant_index >= newVariants.length 
          ? newVariants.length - 1 
          : formData.correct_variant_index
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, photo_url: getText('questions.form.invalidImageType', 'Неподдерживаемый тип файла') })
      return
    }

    // Проверка размера (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors({ ...errors, photo_url: getText('questions.form.imageTooLarge', 'Размер файла превышает 5MB') })
      return
    }

    setIsUploadingImage(true)
    setErrors({ ...errors, photo_url: '' })

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadFormData
      })

      const result = await response.json()

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, photo_url: result.url }))
      } else {
        setErrors({ ...errors, photo_url: result.error || getText('questions.form.uploadError', 'Ошибка загрузки изображения') })
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error)
      setErrors({ ...errors, photo_url: getText('questions.form.uploadError', 'Ошибка загрузки изображения') })
    } finally {
      setIsUploadingImage(false)
      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleReset = () => {
    setFormData({
      question: '',
      type_question: 'standard',
      type_from: 'from_teacher',
      language: 'ru',
      source_id: '',
      points: 1,
      time_limit: 60,
      photo_url: '',
      explanation_ai: '',
      answer_variants: [
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' }
      ],
      correct_variant_index: 0
    })
    setErrors({})
    setIsPreviewMode(false)
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

  const handleFormat = (format: string) => {
    const textarea = questionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.question.substring(start, end)

    // Для формул используем старую логику (без toggle)
    if (format === 'inline-formula' || format === 'block-formula') {
      let formattedText = ''
      
      // Проверяем, что находится перед курсором (для добавления пробела между формулами)
      const textBefore = formData.question.substring(0, start)
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
        formData.question.substring(0, start) + 
        formattedText + 
        formData.question.substring(end)
      
      setFormData({ ...formData, question: newText })
      
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + formattedText.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
      return
    }

    // Для текстового форматирования используем toggle-логику
    const activeFormats = getActiveFormats(formData.question, start, end)
    let newText = formData.question
    let newStart = start
    let newEnd = end

    switch (format) {
      case 'bold':
        if (activeFormats.bold) {
          // Убираем форматирование: удаляем ** с обеих сторон
          const beforeMarker = formData.question.substring(0, start - 2)
          const afterMarker = formData.question.substring(end + 2)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 2
          newEnd = end - 2
        } else {
          // Добавляем форматирование
          const formattedText = `**${selectedText || 'текст'}**`
          newText = formData.question.substring(0, start) + formattedText + formData.question.substring(end)
          newStart = start + 2
          newEnd = start + 2 + (selectedText || 'текст').length
        }
        break

      case 'italic':
        if (activeFormats.italic) {
          // Убираем форматирование: удаляем * с обеих сторон
          const beforeMarker = formData.question.substring(0, start - 1)
          const afterMarker = formData.question.substring(end + 1)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 1
          newEnd = end - 1
        } else {
          // Добавляем форматирование
          const formattedText = `*${selectedText || 'текст'}*`
          newText = formData.question.substring(0, start) + formattedText + formData.question.substring(end)
          newStart = start + 1
          newEnd = start + 1 + (selectedText || 'текст').length
        }
        break

      case 'strikethrough':
        if (activeFormats.strikethrough) {
          // Убираем форматирование: удаляем ~~ с обеих сторон
          const beforeMarker = formData.question.substring(0, start - 2)
          const afterMarker = formData.question.substring(end + 2)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 2
          newEnd = end - 2
        } else {
          // Добавляем форматирование
          const formattedText = `~~${selectedText || 'текст'}~~`
          newText = formData.question.substring(0, start) + formattedText + formData.question.substring(end)
          newStart = start + 2
          newEnd = start + 2 + (selectedText || 'текст').length
        }
        break

      case 'underline':
        if (activeFormats.underline) {
          // Убираем форматирование: удаляем <u> и </u>
          const beforeMarker = formData.question.substring(0, start - 3)
          const afterMarker = formData.question.substring(end + 4)
          newText = beforeMarker + selectedText + afterMarker
          newStart = start - 3
          newEnd = end - 3
        } else {
          // Добавляем форматирование
          const formattedText = `<u>${selectedText || 'текст'}</u>`
          newText = formData.question.substring(0, start) + formattedText + formData.question.substring(end)
          newStart = start + 3
          newEnd = start + 3 + (selectedText || 'текст').length
        }
        break

      default:
        return
    }

    setFormData({ ...formData, question: newText })
    
    // Восстанавливаем фокус и выделение
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }

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

    try {
      // Конвертируем изображение в LaTeX
      const latexCode = await convertImageToLatex(file)
      
      // Вставляем LaTeX код в позицию курсора
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      const newText = 
        formData.question.substring(0, start) + 
        latexCode + 
        formData.question.substring(end)
      
      setFormData({ ...formData, question: newText })
      
      // Восстанавливаем фокус и позицию курсора
      setTimeout(() => {
        textarea.focus()
        const newPosition = start + latexCode.length
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    } catch (error) {
      console.error('Ошибка конвертации изображения:', error)
      alert(getText('questions.form.imageConversionError', 'Ошибка при конвертации изображения'))
    } finally {
      // Очищаем input для возможности повторной загрузки того же файла
      if (imageToLatexInputRef.current) {
        imageToLatexInputRef.current.value = ''
      }
    }
  }

  const handleMagicWand = async () => {
    // Улучшает выделенный текст с помощью AI
    const textarea = questionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.question.substring(start, end).trim()

    if (!selectedText) {
      // Если ничего не выделено, показываем подсказку
      alert(getText('testEditor.errors.selectTextToImprove', 'Выделите текст, который нужно улучшить'))
      return
    }

    try {
      // Получаем язык курса из formData
      const courseLanguage = formData.language === 'kg' ? 'kg' : 'ru'
      
      // Вызываем AI для улучшения текста
      const improvedText = await improveText(selectedText, courseLanguage)

      // Заменяем выделенный текст на улучшенный
    const newText = 
      formData.question.substring(0, start) + 
        improvedText + 
      formData.question.substring(end)
    
    setFormData({ ...formData, question: newText })
    
    // Восстанавливаем фокус и позицию курсора
    setTimeout(() => {
      textarea.focus()
        const newPosition = start + improvedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
    } catch (error) {
      console.error('Ошибка улучшения текста:', error)
      alert(getText('testEditor.errors.improvementError', 'Ошибка при улучшении текста'))
    }
  }

  const handleTogglePreview = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {mode === 'edit' 
              ? getText('questions.editQuestion', 'Редактировать вопрос')
              : getText('questions.createQuestion', 'Создать вопрос')
            }
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <Icons.X className="h-5 w-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Текст вопроса */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('questions.form.questionText', 'Текст вопроса')} <span className="text-red-400">*</span>
            </label>
            
            {/* Toolbar для форматирования */}
            <TestToolbar
              isAiLoading={aiLoading}
              onFormat={handleFormat}
              isPreviewMode={isPreviewMode}
              onImageToLatex={handleImageToLatex}
              onMagicWand={handleMagicWand}
              onTogglePreview={handleTogglePreview}
              onExplainQuestion={() => {
                // В модальном окне создания объяснение пока не поддерживается
                alert('Сначала создайте вопрос, затем сможете получить объяснение')
              }}
              activeFormats={getActiveFormats(formData.question, cursorPosition.start, cursorPosition.end)}
            />
            
            {/* Скрытый input для выбора изображения для конвертации в LaTeX */}
            <input
              ref={imageToLatexInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageToLatexFileSelect}
              className="hidden"
              disabled={aiLoading}
            />
            
            {/* Поле ввода или превью */}
            {isPreviewMode ? (
              <div className="mt-4 p-5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] min-h-[120px] text-[var(--text-primary)]">
                <div className="prose prose-invert max-w-none [&>*]:text-[var(--text-primary)] [&>p]:text-[var(--text-primary)] [&>strong]:text-[var(--text-primary)] [&>em]:text-[var(--text-primary)] [&>u]:text-[var(--text-primary)] [&>s]:text-[var(--text-primary)]">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      // Кастомизация стилей
                      p: ({ children }) => <p className="text-[var(--text-primary)] mb-2">{children}</p>,
                      strong: ({ children }) => <strong className="text-[var(--text-primary)] font-bold">{children}</strong>,
                      em: ({ children }) => <em className="text-[var(--text-primary)] italic">{children}</em>,
                      u: ({ children }) => <u className="text-[var(--text-primary)] underline">{children}</u>,
                      del: ({ children }) => <del className="text-[var(--text-primary)] line-through">{children}</del>,
                      s: ({ children }) => <s className="text-[var(--text-primary)] line-through">{children}</s>,
                      // Стили для LaTeX формул
                      code: ({ inline, children, ...props }) => {
                        if (inline) {
                          return <code className="text-[var(--text-primary)] bg-[var(--bg-card)] px-1 py-0.5 rounded" {...props}>{children}</code>
                        }
                        return <code className="text-[var(--text-primary)] bg-[var(--bg-card)] block p-2 rounded my-2" {...props}>{children}</code>
                      }
                    }}
                  >
                    {formData.question || '*Вопрос не введен*'}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                ref={questionTextareaRef}
                value={formData.question}
                onChange={(e) => {
                  setFormData({ ...formData, question: e.target.value })
                  if (errors.question) {
                    setErrors({ ...errors, question: '' })
                  }
                }}
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
                placeholder={getText('questions.form.questionTextPlaceholder', 'Введите текст вопроса')}
                rows={6}
                className="mt-4 w-full px-5 py-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-300 ease-in-out resize-none"
              />
            )}
            {errors.question && (
              <p className="text-sm text-red-400 mt-1">{errors.question}</p>
            )}
          </div>

          {/* Тип вопроса, Язык */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('questions.form.questionType', 'Тип вопроса')} <span className="text-red-400">*</span>
              </label>
              <Select
                value={formData.type_question}
                onChange={(value) => setFormData({ ...formData, type_question: value as any })}
                options={questionTypeOptions}
                placeholder={getText('questions.form.questionType', 'Выберите тип')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('questions.form.language', 'Язык')} <span className="text-red-400">*</span>
              </label>
              <Select
                value={formData.language}
                onChange={(value) => setFormData({ ...formData, language: value as any })}
                options={languageOptions}
                placeholder={getText('questions.form.language', 'Выберите язык')}
              />
            </div>
          </div>

          {/* Баллы, Лимит времени */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('questions.form.points', 'Баллы')} <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.points || ''}
                onChange={(e) => {
                  const inputValue = e.target.value
                  if (inputValue === '') {
                    setFormData({ ...formData, points: 0 })
                    if (errors.points) {
                      setErrors({ ...errors, points: '' })
                    }
                    return
                  }
                  const value = parseInt(inputValue) || 0
                  if (value >= 1 && value <= 5) {
                    setFormData({ ...formData, points: value })
                    if (errors.points) {
                      setErrors({ ...errors, points: '' })
                    }
                  } else if (value === 0 && inputValue === '0') {
                    setFormData({ ...formData, points: 0 })
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setFormData({ ...formData, points: Math.min(Math.max(1, value), 5) })
                }}
                placeholder="1"
                error={!!errors.points}
              />
              {errors.points ? (
                <p className="text-sm text-red-400 mt-1">{errors.points}</p>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {getText('tests.pointsHint', 'Максимум 5 баллов')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {getText('questions.form.timeLimit', 'Лимит времени (сек)')} <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="120"
                value={formData.time_limit || ''}
                onChange={(e) => {
                  const inputValue = e.target.value
                  if (inputValue === '') {
                    setFormData({ ...formData, time_limit: 0 })
                    if (errors.time_limit) {
                      setErrors({ ...errors, time_limit: '' })
                    }
                    return
                  }
                  const value = parseInt(inputValue) || 0
                  if (value >= 1 && value <= 120) {
                    setFormData({ ...formData, time_limit: value })
                    if (errors.time_limit) {
                      setErrors({ ...errors, time_limit: '' })
                    }
                  } else if (value === 0 && inputValue === '0') {
                    setFormData({ ...formData, time_limit: 0 })
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value) || 60
                  setFormData({ ...formData, time_limit: Math.min(Math.max(1, value), 120) })
                }}
                placeholder="60"
                error={!!errors.time_limit}
              />
              {errors.time_limit ? (
                <p className="text-sm text-red-400 mt-1">{errors.time_limit}</p>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {getText('tests.timeLimitHint', 'Максимум 120 секунд')}
                </p>
              )}
            </div>
          </div>

          {/* Загрузка изображения */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('questions.form.image', 'Изображение (опционально)')}
            </label>
            <div className="space-y-3">
              {/* Поле загрузки файла */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <>
                      <Icons.Loader2 className="h-4 w-4 animate-spin" />
                      {getText('questions.form.uploading', 'Загрузка...')}
                    </>
                  ) : (
                    <>
                      <Icons.Upload className="h-4 w-4" />
                      {getText('questions.form.uploadImage', 'Загрузить изображение')}
                    </>
                  )}
                </button>
                {formData.photo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_url: '' })}
                    className="px-3 py-2 text-red-400 hover:text-red-300 text-sm"
                  >
                    {getText('questions.form.removeImage', 'Удалить')}
                  </button>
                )}
              </div>
              
              {/* Превью изображения */}
              {formData.photo_url && (
                <div className="relative">
                  <img
                    src={formData.photo_url}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 rounded-lg border border-[var(--border-primary)]"
                  />
                </div>
              )}
              
              {/* Поле для ручного ввода URL (опционально) */}
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">
                  {getText('questions.form.orEnterUrl', 'Или введите URL вручную')}
                </label>
                <Input
                  type="url"
                  value={formData.photo_url || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, photo_url: e.target.value })
                    if (errors.photo_url) {
                      setErrors({ ...errors, photo_url: '' })
                    }
                  }}
                  placeholder={getText('questions.form.photoUrlPlaceholder', 'https://example.com/image.jpg')}
                  error={!!errors.photo_url}
                />
                {errors.photo_url && (
                  <p className="text-sm text-red-400 mt-1">{errors.photo_url}</p>
                )}
              </div>
            </div>
          </div>

          {/* Объяснение AI */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('questions.form.aiExplanation', 'Объяснение от AI (опционально)')}
            </label>
            <textarea
              value={formData.explanation_ai || ''}
              onChange={(e) => setFormData({ ...formData, explanation_ai: e.target.value })}
              placeholder={getText('questions.form.aiExplanationPlaceholder', 'Введите объяснение')}
              rows={3}
              className="w-full px-5 py-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all duration-300 ease-in-out resize-none"
            />
          </div>

          {/* Варианты ответов */}
          <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.List className="h-5 w-5" />
                {getText('questions.form.answerVariants', 'Варианты ответов')} <span className="text-red-400">*</span>
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Icons.Plus className="h-4 w-4" />
                {getText('questions.form.addVariant', 'Добавить вариант')}
              </button>
            </div>

            <div className="space-y-3">
              {formData.answer_variants.map((variant, index) => {
                const isSelected = formData.correct_variant_index === index
                return (
                  <div key={index} className="flex items-start gap-3">
                    {/* Индикатор правильности */}
                    <div
                      onClick={() => {
                          setFormData({ ...formData, correct_variant_index: index })
                          if (errors.correct_variant) {
                            setErrors({ ...errors, correct_variant: '' })
                          }
                        }}
                      className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-green-500 bg-green-500'
                          : 'border-[var(--border-primary)]'
                      }`}
                    >
                      {isSelected && <Icons.Check className="h-3 w-3 text-white" />}
                    </div>
                    
                    {/* Блок с текстом ответа */}
                    <div className={`flex-1 px-4 py-2 rounded-lg ${
                      isSelected
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-[var(--bg-card)]'
                    }`}>
                      <textarea
                      value={variant.value}
                      onChange={(e) => handleAnswerVariantChange(index, e.target.value)}
                        placeholder={getText('questions.form.answerVariantPlaceholder', 'Вариант ответа') + ' ' + (index + 1)}
                        rows={2}
                        className={`w-full bg-transparent border-none outline-none placeholder-[var(--text-tertiary)] resize-none overflow-y-auto ${
                          isSelected ? 'text-green-400' : 'text-[var(--text-primary)]'
                        }`}
                    />
                  </div>
                    
                    {/* Remove button */}
                  {formData.answer_variants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                        className="flex-shrink-0 mt-1 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Icons.Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                )
              })}
            </div>
            
            {errors.answer_variants && (
              <p className="text-sm text-red-400 mt-1">{errors.answer_variants}</p>
            )}
            {errors.correct_variant && (
              <p className="text-sm text-red-400 mt-1">{errors.correct_variant}</p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset()
                onClose()
              }}
              disabled={isLoading}
            >
              {getText('common.cancel', 'Отмена')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              {mode === 'edit' 
                ? getText('questions.form.saveChanges', 'Сохранить изменения')
                : getText('questions.form.createQuestion', 'Создать вопрос')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateQuestionModal

