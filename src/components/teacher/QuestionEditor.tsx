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
import TestToolbar from '@/components/teacher/TestToolbar'
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
  onQuestionUpdate?: (questionId: string, data: { question: string; type: QuestionType }) => void
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  questionId,
  testId,
  testLanguage,
  onQuestionUpdate
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [questionType, setQuestionType] = useState<QuestionType>('standard')
  const [questionText, setQuestionText] = useState('')
  const [answers, setAnswers] = useState<Array<{ value: string; isCorrect: boolean }>>([
    { value: '', isCorrect: false },
    { value: '', isCorrect: false }
  ])
  const [points, setPoints] = useState(1)
  const [timeLimit, setTimeLimit] = useState(60)
  const [imageUrl, setImageUrl] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageToLatexInputRef = useRef<HTMLInputElement>(null)
  
  // AI hooks - с проверкой на существование
  const [aiLoading, setAiLoading] = useState(false)
  const aiHook = typeof window !== 'undefined' ? useAI() : null
  const improveText = aiHook?.improveText
  const convertImageToLatex = aiHook?.convertImageToLatex

  useEffect(() => {
    setMounted(true)
  }, [])

  // Загрузка данных вопроса
  useEffect(() => {
    if (!mounted || !questionId) return

    const loadedData = loadQuestionDraft(questionId, questionType)
    if (loadedData) {
      setQuestionText(loadedData.question || '')
      setAnswers(loadedData.answers || [{ value: '', isCorrect: false }, { value: '', isCorrect: false }])
      setPoints(loadedData.points || 1)
      setTimeLimit(loadedData.timeLimit || 60)
      setImageUrl(loadedData.imageUrl || '')
    }
  }, [mounted, questionId, questionType])

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
        language: testLanguage
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
  }, [mounted, questionId, questionType, questionText, answers, points, timeLimit, imageUrl, testLanguage, onQuestionUpdate])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  // Обработчики форматирования текста
  const handleFormat = (format: string) => {
    const textarea = questionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = questionText.substring(start, end)

    let formattedText = ''
    let newCursorPos = start

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        newCursorPos = start + 2
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        newCursorPos = start + 1
        break
      case 'underline':
        formattedText = `<u>${selectedText}</u>`
        newCursorPos = start + 3
        break
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`
        newCursorPos = start + 2
        break
      case 'inline-formula':
        formattedText = `$${selectedText}$`
        newCursorPos = start + 1
        break
      case 'block-formula':
        formattedText = `$$${selectedText}$$`
        newCursorPos = start + 2
        break
      default:
        return
    }

    const newText = questionText.substring(0, start) + formattedText + questionText.substring(end)
    setQuestionText(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length)
    }, 0)
  }

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

  // AI улучшение текста
  const handleMagicWand = async () => {
    if (!improveText) {
      alert(getText('testEditor.errors.aiNotAvailable', 'AI функция недоступна'))
      return
    }

    const textarea = questionTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = questionText.substring(start, end)

    if (!selectedText.trim()) {
      alert(getText('testEditor.errors.selectTextToImprove', 'Выделите текст для улучшения'))
      return
    }

    setAiLoading(true)
    try {
      const improvedText = await improveText(selectedText, testLanguage)
      const newText = questionText.substring(0, start) + improvedText + questionText.substring(end)
      setQuestionText(newText)
    } catch (error) {
      console.error('Ошибка улучшения текста:', error)
      alert(getText('testEditor.errors.improvementError', 'Ошибка при улучшении текста'))
    } finally {
      setAiLoading(false)
    }
  }

  // Конвертация изображения в LaTeX
  const handleImageToLatex = () => {
    if (!convertImageToLatex) {
      alert(getText('testEditor.errors.aiNotAvailable', 'AI функция недоступна'))
      return
    }
    imageToLatexInputRef.current?.click()
  }

  const handleImageToLatexFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!convertImageToLatex) return

    const file = e.target.files?.[0]
    if (!file) return

    setAiLoading(true)
    try {
      const latexCode = await convertImageToLatex(file)
      const textarea = questionTextareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = questionText.substring(0, start) + latexCode + questionText.substring(end)
      setQuestionText(newText)

      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + latexCode.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    } catch (error: any) {
      console.error('Ошибка конвертации изображения:', error)
      alert(getText('questions.form.imageConversionError', 'Ошибка конвертации изображения') + ': ' + (error?.message || ''))
    } finally {
      setAiLoading(false)
      if (imageToLatexInputRef.current) {
        imageToLatexInputRef.current.value = ''
      }
    }
  }

  // Управление вариантами ответов
  const handleAddAnswer = () => {
    setAnswers([...answers, { value: '', isCorrect: false }])
  }

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index))
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
    <div className="h-full flex flex-col bg-[var(--bg-card)]">
      {/* Заголовок редактора */}
      <div className="px-6 py-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {getText('tests.questionEditor', 'Редактор вопроса')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isPreviewMode
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {isPreviewMode 
                ? getText('tests.editMode', 'Редактирование')
                : getText('tests.previewMode', 'Предпросмотр')
              }
            </button>
          </div>
        </div>
      </div>

      {/* Контент редактора */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Тип вопроса */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            {getText('tests.questionType', 'Тип вопроса')} <span className="text-red-400">*</span>
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
          >
            <option value="standard">{getText('tests.types.standardFull', 'Стандартный')}</option>
            <option value="analogy">{getText('tests.types.analogyFull', 'Аналогия')}</option>
            <option value="grammar">{getText('tests.types.grammarFull', 'Грамматика')}</option>
            <option value="math1">{getText('tests.types.math1Full', 'Математика 1')}</option>
            <option value="math2">{getText('tests.types.math2Full', 'Математика 2')}</option>
            <option value="rac">{getText('tests.types.racFull', 'Чтение и понимание')}</option>
          </select>
        </div>

        {/* Текст вопроса */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              {getText('tests.questionText', 'Текст вопроса')} <span className="text-red-400">*</span>
            </label>
            {!isPreviewMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMagicWand}
                  disabled={aiLoading}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                  title={getText('tests.improveText', 'Улучшить текст с помощью AI')}
                >
                  {aiLoading ? (
                    <Icons.Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
                  ) : (
                    <Icons.Zap className="h-4 w-4 text-[var(--accent-primary)]" />
                  )}
                </button>
                <button
                  onClick={handleImageToLatex}
                  disabled={aiLoading}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                  title={getText('tests.imageToLatex', 'Картинка → LaTeX')}
                >
                  <Icons.Image className="h-4 w-4 text-[var(--accent-primary)]" />
                </button>
              </div>
            )}
          </div>

          {!isPreviewMode ? (
            <>
              <TestToolbar
                onFormat={handleFormat}
                onImageClick={() => fileInputRef.current?.click()}
              />
              <textarea
                ref={questionTextareaRef}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={getText('tests.questionPlaceholder', 'Введите текст вопроса...')}
                rows={8}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none text-sm font-mono"
              />
            </>
          ) : (
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] min-h-[200px]">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                {questionText || getText('tests.emptyQuestion', 'Текст вопроса отсутствует')}
              </ReactMarkdown>
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

        {/* Варианты ответов */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              {getText('tests.answers', 'Варианты ответов')} <span className="text-red-400">*</span>
            </label>
            {questionType === 'standard' && (
              <button
                onClick={handleAddAnswer}
                className="text-xs text-[var(--accent-primary)] hover:underline"
              >
                + {getText('tests.addAnswer', 'Добавить вариант')}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={answer.isCorrect}
                  onChange={() => handleCorrectAnswerChange(index)}
                  className="flex-shrink-0"
                />
                <input
                  type="text"
                  value={answer.value}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder={`${getText('tests.answer', 'Ответ')} ${index + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                />
                {questionType === 'standard' && answers.length > 2 && (
                  <button
                    onClick={() => handleRemoveAnswer(index)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Баллы и время */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('tests.points', 'Баллы')} <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('tests.timeLimit', 'Время (сек)')} <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Math.max(10, parseInt(e.target.value) || 60))}
              min="10"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
            />
          </div>
        </div>
      </div>

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
      />
    </div>
  )
}

export default QuestionEditor

