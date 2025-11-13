'use client'

import React from 'react'
import { Icons } from '@/components/ui/Icons'
import Tooltip from '@/components/ui/Tooltip'

interface Question {
  id: string
  question: string
  type_question: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'
  type_from: 'from_lesson' | 'from_teacher' | 'from_trial' | 'from_student' | 'from_mentor'
  language: 'ru' | 'kg'
  created_at: string
  hasComplaint?: boolean
  averageCorrect?: number
}

interface QuestionCardProps {
  question: Question
  onAnswer: (questionId: string) => void
  onMarkSolved: (questionId: string) => void
  onMarkIncorrect: (questionId: string) => void
  onViewDetails: (questionId: string) => void
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  onMarkSolved,
  onMarkIncorrect,
  onViewDetails
}) => {
  const getQuestionTypeLabel = (type: Question['type_question']) => {
    const labels: Record<Question['type_question'], string> = {
      math1: 'Математика 1',
      math2: 'Математика 2',
      analogy: 'Аналогия',
      rac: 'РАЦ',
      grammar: 'Грамматика',
      standard: 'Стандартный',
    }
    return labels[type] || type
  }

  const getSourceLabel = (source: Question['type_from']) => {
    const labels: Record<Question['type_from'], string> = {
      from_lesson: 'Из урока',
      from_teacher: 'От преподавателя',
      from_trial: 'Из пробного теста',
      from_student: 'От ученика',
      from_mentor: 'От ментора',
    }
    return labels[source] || source
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6 hover:bg-[#1a1a1a] transition-colors">
      <div className="flex items-start justify-between gap-6">
        {/* Левая часть: Информация о вопросе */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {question.hasComplaint && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
                ⚠️ Проблемный
              </span>
            )}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
              {getQuestionTypeLabel(question.type_question)}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 flex-shrink-0">
              {getSourceLabel(question.type_from)}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
              {question.language === 'ru' ? 'Русский' : 'Кыргызский'}
            </span>
          </div>
          
          <h3 className="font-medium text-white mb-3 line-clamp-2">
            {question.question}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              {new Date(question.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
            {question.averageCorrect !== undefined && (
              <span>
                Средний % правильных: <span className="text-white font-medium">{question.averageCorrect.toFixed(1)}%</span>
              </span>
            )}
          </div>
        </div>

        {/* Правая часть: Действия */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip text="Детали">
            <button
              onClick={() => onViewDetails(question.id)}
              className="p-2 rounded-lg bg-[#242424] hover:bg-[#2a2a2a] transition-colors"
            >
              <Icons.Eye className="h-5 w-5 text-white" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

export default QuestionCard

