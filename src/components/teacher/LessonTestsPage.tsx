'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import TestRACBlock from './TestRACBlock'
import TestToolbar from './TestToolbar'
import TestTypeSelectorMenu from './TestTypeSelectorMenu'

interface LessonTestsPageProps {
  courseLanguage?: 'ru' | 'kg'
  onTestsCountChange?: (count: number) => void
  testsRef?: React.RefObject<HTMLDivElement>
  lessonId?: string
  totalQuestions?: number
  disabled?: boolean
}

interface TestBlock {
  id: string
  type: 'standard' | 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar'
  question: string
  answers: Array<{
    id: string
    value: string
    isCorrect: boolean
  }>
  points: number
  timeLimit: number
}

const LessonTestsPage: React.FC<LessonTestsPageProps> = ({
  courseLanguage = 'ru',
  onTestsCountChange,
  testsRef,
  lessonId,
  totalQuestions,
  disabled = false
}) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [testBlocks, setTestBlocks] = useState<string[]>([])
  const [testData, setTestData] = useState<Record<string, TestBlock>>({})
  const [maxTestsError, setMaxTestsError] = useState<string | null>(null)
  const activeBlockId = useRef<string | null>(null)

  // Проверка лимита тестов
  useEffect(() => {
    if (totalQuestions && testBlocks.length >= totalQuestions) {
      setMaxTestsError(t('testEditor.maxTestsReached', `Достигнут лимит тестов: ${totalQuestions}`))
    } else {
      setMaxTestsError(null)
    }
  }, [testBlocks.length, totalQuestions, t])

  // Уведомление о количестве тестов
  useEffect(() => {
    onTestsCountChange?.(testBlocks.length)
  }, [testBlocks.length, onTestsCountChange])

  const handleAddTest = (type: TestBlock['type']) => {
    if (totalQuestions && testBlocks.length >= totalQuestions) {
      return
    }

    const newId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newBlock: TestBlock = {
      id: newId,
      type,
      question: '',
      answers: [
        { id: `${newId}_a`, value: '', isCorrect: false },
        { id: `${newId}_b`, value: '', isCorrect: false },
        { id: `${newId}_c`, value: '', isCorrect: false },
        { id: `${newId}_d`, value: '', isCorrect: false }
      ],
      points: 1,
      timeLimit: 60
    }

    setTestBlocks(prev => [...prev, newId])
    setTestData(prev => ({ ...prev, [newId]: newBlock }))
    activeBlockId.current = newId
  }

  const handleRemoveTest = (blockId: string) => {
    setTestBlocks(prev => prev.filter(id => id !== blockId))
    setTestData(prev => {
      const newData = { ...prev }
      delete newData[blockId]
      return newData
    })
    
    if (activeBlockId.current === blockId) {
      activeBlockId.current = null
    }
  }

  const handleUpdateTest = (blockId: string, updates: Partial<TestBlock>) => {
    setTestData(prev => ({
      ...prev,
      [blockId]: { ...prev[blockId], ...updates }
    }))
  }

  const handleFormat = (action: string) => {
    // Обработка форматирования текста
    console.log('Format action:', action)
  }

  const getIsPreviewMode = () => {
    return false // Пока всегда режим редактирования
  }

  const handleOpenImageLatex = () => {
    // Обработка конвертации изображения в LaTeX
    console.log('Open image to LaTeX')
  }

  const handleMagicWand = () => {
    // Обработка AI-генерации
    console.log('Magic wand clicked')
  }

  return (
    <>
      <div className="bg-[#151515] rounded-2xl">
        <form className="p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Icons.Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              <p className="text-gray-400 text-sm">Загрузка вопросов...</p>
            </div>
          ) : testBlocks.length === 0 ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Icons.HelpCircle className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-medium mb-2">
                    {t('testEditor.noTestsYet', 'Пока нет тестов')}
                  </h3>
                  {disabled ? (
                    <p className="text-yellow-400 text-sm">
                      {t('testEditor.fillLessonFields', 'Заполните поля урока')}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      {t('testEditor.clickPlusButton', 'Нажмите кнопку плюс')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Предупреждение о лимите */}
              {maxTestsError && (
                <div className="mb-4 flex items-center gap-2">
                  <Icons.AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">
                    {maxTestsError}
                  </p>
                </div>
              )}
              
              {/* Контейнер блоков */}
              <div className="space-y-6 pb-24">
                {testBlocks.map((blockId) => (
                  <div 
                    key={blockId} 
                    onFocus={() => { activeBlockId.current = blockId }}
                  >
                    <TestRACBlock
                      blockId={blockId}
                      data={testData[blockId]}
                      onUpdate={(updates) => handleUpdateTest(blockId, updates)}
                      onRemove={() => handleRemoveTest(blockId)}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </form>
      </div>
      
      {/* Плавающая панель инструментов */}
      <div className="hidden lg:block fixed bottom-4 left-[50%] lg:left-[calc(50%+80px)] -translate-x-1/2 z-50">
        <TestToolbar 
          onFormat={handleFormat} 
          isPreviewMode={getIsPreviewMode()} 
          onImageToLatex={handleOpenImageLatex}
          onMagicWand={handleMagicWand}
          onExplainQuestion={() => {
            // В LessonTestsPage объяснение вопросов пока не поддерживается
            alert('Функция объяснения доступна только в редакторе тестов')
          }}
        />
      </div>

      {/* Плавающее меню добавления теста */}
      <div className="fixed bottom-4 right-16 z-50">
        <TestTypeSelectorMenu
          onSelectType={handleAddTest}
          disabled={disabled || (totalQuestions ? testBlocks.length >= totalQuestions : false)}
        />
      </div>
    </>
  )
}

export default LessonTestsPage
