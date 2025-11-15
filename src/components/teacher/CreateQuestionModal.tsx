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

    if (!formData.source_id.trim()) {
      newErrors.source_id = getText('questions.form.sourceId', 'ID источника обязателен')
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
      onSubmit(formData)
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
    // TODO: Реализовать конвертацию изображения в LaTeX
    console.log('Конвертация изображения в LaTeX')
  }

  const handleMagicWand = () => {
    // Переводит выделенный текст в LaTeX формулу
    const textarea = questionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.question.substring(start, end).trim()

    if (!selectedText) {
      // Если ничего не выделено, показываем подсказку
      alert('Выделите текст, который нужно перевести в LaTeX формулу')
      return
    }

    // Простой перевод текста в LaTeX
    // Можно улучшить с помощью AI API
    let latexText = selectedText
    
    // Базовые преобразования
    latexText = latexText
      .replace(/\^(\d+)/g, '^{$1}') // x^2 -> x^{2}
      .replace(/\^([a-zA-Z])/g, '^{$1}') // x^a -> x^{a}
      .replace(/\/([a-zA-Z0-9]+)/g, '\\frac{1}{$1}') // /x -> \frac{1}{x}
      .replace(/\*([a-zA-Z0-9]+)/g, ' \\cdot $1') // *x -> \cdot x
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}') // sqrt(x) -> \sqrt{x}
      .replace(/sin\(/g, '\\sin(')
      .replace(/cos\(/g, '\\cos(')
      .replace(/tan\(/g, '\\tan(')
      .replace(/log\(/g, '\\log(')
      .replace(/ln\(/g, '\\ln(')
      .replace(/pi/g, '\\pi')
      .replace(/infinity|∞/g, '\\infty')
      .replace(/alpha/g, '\\alpha')
      .replace(/beta/g, '\\beta')
      .replace(/gamma/g, '\\gamma')
      .replace(/delta/g, '\\delta')
      .replace(/theta/g, '\\theta')
      .replace(/lambda/g, '\\lambda')
      .replace(/mu/g, '\\mu')
      .replace(/sigma/g, '\\sigma')
      .replace(/phi/g, '\\phi')
      .replace(/omega/g, '\\omega')

    // Обертываем в формулу
    const formattedText = `$$${latexText}$$`

    const newText = 
      formData.question.substring(0, start) + 
      formattedText + 
      formData.question.substring(end)
    
    setFormData({ ...formData, question: newText })
    
    // Восстанавливаем фокус и позицию курсора
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + formattedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
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
      <div className="bg-[#151515] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">
            {mode === 'edit' 
              ? getText('questions.editQuestion', 'Редактировать вопрос')
              : getText('questions.createQuestion', 'Создать вопрос')
            }
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#242424] rounded-lg transition-colors"
          >
            <Icons.X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Текст вопроса */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {getText('questions.form.questionText', 'Текст вопроса')} <span className="text-red-400">*</span>
            </label>
            
            {/* Toolbar для форматирования */}
            <TestToolbar
              onFormat={handleFormat}
              isPreviewMode={isPreviewMode}
              onImageToLatex={handleImageToLatex}
              onMagicWand={handleMagicWand}
              onTogglePreview={handleTogglePreview}
              activeFormats={getActiveFormats(formData.question, cursorPosition.start, cursorPosition.end)}
            />
            
            {/* Поле ввода или превью */}
            {isPreviewMode ? (
              <div className="mt-4 p-5 rounded-xl border border-gray-600 bg-[#0b0b0b] min-h-[120px] text-white">
                <div className="prose prose-invert max-w-none [&>*]:text-white [&>p]:text-white [&>strong]:text-white [&>em]:text-white [&>u]:text-white [&>s]:text-white">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      // Кастомизация стилей для темной темы
                      p: ({ children }) => <p className="text-white mb-2">{children}</p>,
                      strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                      em: ({ children }) => <em className="text-white italic">{children}</em>,
                      u: ({ children }) => <u className="text-white underline">{children}</u>,
                      del: ({ children }) => <del className="text-white line-through">{children}</del>,
                      s: ({ children }) => <s className="text-white line-through">{children}</s>,
                      // Стили для LaTeX формул
                      code: ({ inline, children, ...props }) => {
                        if (inline) {
                          return <code className="text-white bg-[#242424] px-1 py-0.5 rounded" {...props}>{children}</code>
                        }
                        return <code className="text-white bg-[#242424] block p-2 rounded my-2" {...props}>{children}</code>
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
                className="mt-4 w-full px-5 py-4 rounded-xl border border-gray-600 bg-[#0b0b0b] text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out resize-none"
              />
            )}
            {errors.question && (
              <p className="text-sm text-red-400 mt-1">{errors.question}</p>
            )}
          </div>

          {/* Тип вопроса, Источник, Язык */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('questions.form.source', 'Источник')} <span className="text-red-400">*</span>
              </label>
              <Select
                value={formData.type_from}
                onChange={(value) => setFormData({ ...formData, type_from: value as any })}
                options={sourceOptions}
                placeholder={getText('questions.form.source', 'Выберите источник')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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

          {/* ID источника, Баллы, Лимит времени */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('questions.form.sourceId', 'ID источника')} <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.source_id}
                onChange={(e) => {
                  setFormData({ ...formData, source_id: e.target.value })
                  if (errors.source_id) {
                    setErrors({ ...errors, source_id: '' })
                  }
                }}
                placeholder={getText('questions.form.sourceIdPlaceholder', 'Введите ID источника')}
                error={!!errors.source_id}
              />
              {errors.source_id && (
                <p className="text-sm text-red-400 mt-1">{errors.source_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('questions.form.points', 'Баллы')} <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => {
                  setFormData({ ...formData, points: parseInt(e.target.value) || 1 })
                  if (errors.points) {
                    setErrors({ ...errors, points: '' })
                  }
                }}
                placeholder="1"
                error={!!errors.points}
              />
              {errors.points && (
                <p className="text-sm text-red-400 mt-1">{errors.points}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getText('questions.form.timeLimit', 'Лимит времени (сек)')} <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={formData.time_limit}
                onChange={(e) => {
                  setFormData({ ...formData, time_limit: parseInt(e.target.value) || 60 })
                  if (errors.time_limit) {
                    setErrors({ ...errors, time_limit: '' })
                  }
                }}
                placeholder="60"
                error={!!errors.time_limit}
              />
              {errors.time_limit && (
                <p className="text-sm text-red-400 mt-1">{errors.time_limit}</p>
              )}
            </div>
          </div>

          {/* URL фото */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {getText('questions.form.photoUrl', 'URL фото (опционально)')}
            </label>
            <Input
              type="url"
              value={formData.photo_url || ''}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder={getText('questions.form.photoUrlPlaceholder', 'https://example.com/image.jpg')}
            />
          </div>

          {/* Объяснение AI */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {getText('questions.form.aiExplanation', 'Объяснение от AI (опционально)')}
            </label>
            <textarea
              value={formData.explanation_ai || ''}
              onChange={(e) => setFormData({ ...formData, explanation_ai: e.target.value })}
              placeholder={getText('questions.form.aiExplanationPlaceholder', 'Введите объяснение')}
              rows={3}
              className="w-full px-5 py-4 rounded-xl border border-gray-600 bg-[#0b0b0b] text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-300 ease-in-out resize-none"
            />
          </div>

          {/* Варианты ответов */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                {getText('questions.form.answerVariants', 'Варианты ответов')} <span className="text-red-400">*</span>
              </label>
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
              {formData.answer_variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="correct_variant"
                        checked={formData.correct_variant_index === index}
                        onChange={() => {
                          setFormData({ ...formData, correct_variant_index: index })
                          if (errors.correct_variant) {
                            setErrors({ ...errors, correct_variant: '' })
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-[#242424] border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-400">
                        {formData.correct_variant_index === index 
                          ? getText('questions.form.correctAnswer', 'Правильный ответ')
                          : getText('questions.form.answerVariantPlaceholder', 'Вариант') + ' ' + (index + 1)
                        }
                      </span>
                    </div>
                    <Input
                      type="text"
                      value={variant.value}
                      onChange={(e) => handleAnswerVariantChange(index, e.target.value)}
                      placeholder={getText('questions.form.answerVariantPlaceholder', 'Вариант ответа') + ' ' + (index + 1)}
                    />
                  </div>
                  {formData.answer_variants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Icons.Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.answer_variants && (
              <p className="text-sm text-red-400 mt-1">{errors.answer_variants}</p>
            )}
            {errors.correct_variant && (
              <p className="text-sm text-red-400 mt-1">{errors.correct_variant}</p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
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

