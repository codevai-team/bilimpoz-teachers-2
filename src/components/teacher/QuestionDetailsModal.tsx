'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

interface QuestionDetails {
  id: string
  question: string
  type_question: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'
  type_from: 'from_lesson' | 'from_teacher' | 'from_trial' | 'from_student' | 'from_mentor'
  language: 'ru' | 'kg'
  created_at: string
  photo_url?: string
  explanation_ai?: string
  points?: number
  time_limit?: number
  answer_variants?: Array<{ value: string }>
  correct_variant_index?: number
  total_answers?: number
  correct_answers?: number
  wrong_answers?: number
  correct_rate?: number
}

interface QuestionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  question: QuestionDetails | null
  onEdit?: () => void
  onDelete?: (questionId: string) => Promise<void>
}

const QuestionDetailsModal: React.FC<QuestionDetailsModalProps> = ({
  isOpen,
  onClose,
  question,
  onEdit,
  onDelete
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const getQuestionTypeLabel = (type: QuestionDetails['type_question']) => {
    if (!mounted || !ready) {
      const fallbackLabels: Record<QuestionDetails['type_question'], string> = {
        math1: 'Математика 1',
        math2: 'Математика 2',
        analogy: 'Аналогия',
        rac: 'РАЦ',
        grammar: 'Грамматика',
        standard: 'Стандартный',
      }
      return fallbackLabels[type] || type
    }
    const labels: Record<QuestionDetails['type_question'], string> = {
      math1: t('questions.questionTypes.math1'),
      math2: t('questions.questionTypes.math2'),
      analogy: t('questions.questionTypes.analogy'),
      rac: t('questions.questionTypes.rac'),
      grammar: t('questions.questionTypes.grammar'),
      standard: t('questions.questionTypes.standard'),
    }
    return labels[type] || type
  }

  const getSourceLabel = (source: QuestionDetails['type_from']) => {
    if (!mounted || !ready) {
      const fallbackLabels: Record<QuestionDetails['type_from'], string> = {
        from_lesson: 'Из урока',
        from_teacher: 'От преподавателя',
        from_trial: 'Из пробного теста',
        from_student: 'От ученика',
        from_mentor: 'От ментора',
      }
      return fallbackLabels[source] || source
    }
    const labels: Record<QuestionDetails['type_from'], string> = {
      from_lesson: t('questions.sources.from_lesson'),
      from_teacher: t('questions.sources.from_teacher'),
      from_trial: t('questions.sources.from_trial'),
      from_student: t('questions.sources.from_student'),
      from_mentor: t('questions.sources.from_mentor'),
    }
    return labels[source] || source
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async () => {
    if (!onDelete || !question) return
    
    setIsDeleting(true)
    setError(null)
    try {
      await onDelete(question.id)
      setShowDeleteDialog(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !question) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div className="bg-[var(--bg-card)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Заголовок (Sticky) */}
          <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-primary)] p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                {getText('questions.details.title', 'Детали вопроса')}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">ID: {question.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <Icons.X className="h-5 w-5 text-[var(--text-primary)]" />
            </button>
          </div>

          {/* Контент (Scrollable) */}
          <div className="p-6 space-y-6">
            {/* Блок ошибки */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Icons.AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Основная информация */}
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.Info className="h-5 w-5" />
                {getText('questions.details.basicInfo', 'Основная информация')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                    {getText('questions.questionType', 'Тип вопроса')}
                  </label>
                  <div className="px-3 py-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)]">
                    {getQuestionTypeLabel(question.type_question)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                    {getText('questions.source', 'Источник')}
                  </label>
                  <div className="px-3 py-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)]">
                    {getSourceLabel(question.type_from)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                    {getText('questions.language', 'Язык')}
                  </label>
                  <div className="px-3 py-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)]">
                    {question.language === 'ru'
                      ? getText('questions.languages.ru', 'Русский')
                      : getText('questions.languages.kg', 'Кыргызский')
                    }
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-tertiary)] mb-1">
                    {getText('questions.createdAt', 'Дата создания')}
                  </label>
                  <div className="px-3 py-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)]">
                    {formatDate(question.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Текст вопроса */}
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.HelpCircle className="h-5 w-5" />
                {getText('questions.form.questionText', 'Текст вопроса')}
              </h3>

              <div className="text-[var(--text-primary)]">
                <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                  >
                    {question.question}
                  </ReactMarkdown>
                </div>
              </div>

              {question.photo_url && (
                <div className="mt-4">
                  <label className="block text-sm text-[var(--text-tertiary)] mb-2">
                    {getText('questions.form.image', 'Изображение')}
                  </label>
                  <img
                    src={question.photo_url}
                    alt="Question"
                    className="max-w-md rounded-lg border border-[var(--border-primary)]"
                  />
                </div>
              )}
            </div>

            {/* Варианты ответов */}
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.List className="h-5 w-5" />
                {getText('questions.form.answerVariants', 'Варианты ответов')}
              </h3>

              <div className="space-y-3">
                {(question.answer_variants || []).map((answer, index) => {
                  const isCorrect = question.correct_variant_index === index
                  return (
                    <div key={index} className="flex items-start gap-3">
                      {/* Индикатор правильности */}
                      <div
                        className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isCorrect
                            ? 'border-green-500 bg-green-500'
                            : 'border-[var(--border-primary)]'
                        }`}
                      >
                        {isCorrect && <Icons.Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Блок с текстом ответа */}
                      <div
                        className={`flex-1 px-4 py-2 rounded-lg ${
                          isCorrect
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-[var(--bg-card)]'
                        }`}
                      >
                        <div className={isCorrect ? 'text-green-400' : 'text-[var(--text-primary)]'}>
                          <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex, rehypeRaw]}
                            >
                              {answer.value || getText('questions.emptyAnswer', 'Пустой ответ')}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Настройки */}
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.Settings className="h-5 w-5" />
                {getText('questions.details.settings', 'Настройки')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-tertiary)] mb-2">
                    {getText('questions.form.points', 'Баллы')}
                  </label>
                  <div className="px-4 py-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)]">
                    {question.points || '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-tertiary)] mb-2">
                    {getText('questions.form.timeLimit', 'Время (сек)')}
                  </label>
                  <div className="px-4 py-2 bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)]">
                    {question.time_limit || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Объяснение (AI) */}
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Icons.BookOpen className="h-5 w-5" />
                {getText('questions.details.aiExplanation', 'Объяснение (AI)')}
              </h3>

              <div className="text-[var(--text-primary)]">
                {question.explanation_ai ? (
                  <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                    >
                      {question.explanation_ai}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[var(--text-muted)]">
                    {getText('questions.details.noExplanation', 'Объяснение отсутствует')}
                  </p>
                )}
              </div>
            </div>

            {/* Статистика ответов */}
            {(!question.total_answers || question.total_answers === 0) ? (
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Icons.BarChart3 className="h-5 w-5" />
                  {getText('questions.details.statistics', 'Статистика ответов')}
                </h3>
                <p className="text-[var(--text-tertiary)] text-center py-4">
                  {getText('questions.details.noStatistics', 'Нет статистики')}
                </p>
              </div>
            ) : (
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Icons.BarChart3 className="h-5 w-5" />
                  {getText('questions.details.statistics', 'Статистика ответов')}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-card)] rounded-lg p-4">
                    <p className="text-sm text-[var(--text-tertiary)] mb-1">
                      {getText('questions.details.totalAnswers', 'Всего ответов')}
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{question.total_answers}</p>
                  </div>

                  <div className="bg-[var(--bg-card)] rounded-lg p-4">
                    <p className="text-sm text-[var(--text-tertiary)] mb-1">
                      {getText('questions.details.correctAnswers', 'Правильных')}
                    </p>
                    {question.correct_answers && question.correct_answers > 0 ? (
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{question.correct_answers}</p>
                    ) : (
                      <p className="text-lg font-medium text-[var(--text-muted)]">—</p>
                    )}
                  </div>

                  <div className="bg-[var(--bg-card)] rounded-lg p-4">
                    <p className="text-sm text-[var(--text-tertiary)] mb-1">
                      {getText('questions.details.wrongAnswers', 'Неправильных')}
                    </p>
                    {question.wrong_answers && question.wrong_answers > 0 ? (
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{question.wrong_answers}</p>
                    ) : (
                      <p className="text-lg font-medium text-[var(--text-muted)]">—</p>
                    )}
                  </div>

                  <div className="bg-[var(--bg-card)] rounded-lg p-4">
                    <p className="text-sm text-[var(--text-tertiary)] mb-1">
                      {getText('questions.details.correctRate', 'Процент правильных')}
                    </p>
                    {question.correct_rate !== undefined ? (
                      <p className="text-2xl font-bold text-[var(--text-primary)]">
                        {question.correct_rate.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-lg font-medium text-[var(--text-muted)]">—</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Футер (Sticky) */}
          <div className="sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-primary)] p-6 flex items-center justify-between">
            <div>
              {onDelete && (
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-red-500/20 text-[var(--text-primary)] rounded-xl transition-colors flex items-center gap-2"
                >
                  <Icons.Trash2 className="h-4 w-4" />
                  {getText('questions.details.delete', 'Удалить')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[var(--text-tertiary)] font-semibold border border-transparent rounded-xl hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-all duration-200"
              >
                {getText('questions.details.close', 'Закрыть')}
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-[var(--bg-active-button)] text-[var(--text-active-button)] font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl border border-[var(--border-primary)] transition-all duration-200 flex items-center gap-2"
                >
                  <Icons.Edit className="h-4 w-4" />
                  {getText('questions.tooltips.edit', 'Редактировать')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteDialog(false)
            }
          }}
        >
          <div className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {getText('questions.details.deleteConfirmTitle', 'Удалить вопрос?')}
            </h3>
            <p className="text-[var(--text-tertiary)] mb-6">
              {getText('questions.details.deleteConfirmMessage', 'Вы уверены, что хотите удалить этот вопрос? Это действие нельзя отменить.')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-[var(--text-tertiary)] font-semibold border border-transparent rounded-xl hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getText('common.cancel', 'Отмена')}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Icons.Loader2 className="h-4 w-4 animate-spin" />
                    {getText('questions.details.deleting', 'Удаление...')}
                  </>
                ) : (
                  <>
                    <Icons.Trash2 className="h-4 w-4" />
                    {getText('questions.details.delete', 'Удалить')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default QuestionDetailsModal
