'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import '@uiw/react-md-editor/markdown-editor.css'
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface LatexPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  latexCode: string
  onConfirm: (latexCode: string) => void
  onCancel?: () => void
}

export default function LatexPreviewModal({
  isOpen,
  onClose,
  latexCode: initialLatexCode,
  onConfirm,
  onCancel
}: LatexPreviewModalProps) {
  const [latexCode, setLatexCode] = useState(initialLatexCode)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const { isKeyboardOpen, viewportHeight, isMobile } = useMobileKeyboard()

  useEffect(() => {
    if (isOpen) {
      setLatexCode(initialLatexCode)
      setIsPreviewMode(false)
    }
  }, [isOpen, initialLatexCode])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(latexCode)
    onClose()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onClose()
  }

  // Вычисляем стили для правильного позиционирования на мобильных
  const getModalStyles = () => {
    if (!isMobile) {
      return "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
    }
    
    if (isKeyboardOpen) {
      // На мобильных с открытой клавиатурой позиционируем модальное окно в верхней части
      return "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-75 pt-4"
    }
    
    return "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
  }

  const getModalContainerStyles = () => {
    if (!isMobile) {
      return "bg-[#1a1a1a] rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
    }
    
    if (isKeyboardOpen) {
      // На мобильных с клавиатурой уменьшаем высоту и позиционируем выше
      const maxHeight = Math.min(viewportHeight * 0.6, 400)
      return `bg-[#1a1a1a] rounded-lg border border-gray-700 w-full max-w-4xl flex flex-col m-4`
    }
    
    return "bg-[#1a1a1a] rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
  }

  return (
    <div className={getModalStyles()}>
      <div 
        className={getModalContainerStyles()}
        style={isMobile && isKeyboardOpen ? { 
          maxHeight: `${Math.min(viewportHeight * 0.6, 400)}px` 
        } : undefined}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Предпросмотр LaTeX формулы
          </h2>
          <div className="flex items-center gap-2">
            {/* Переключатель режима */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              {isPreviewMode ? 'Редактировать' : 'Предпросмотр'}
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full rounded-lg overflow-hidden border border-gray-700 bg-[#151515]">
            <MDEditor
              value={latexCode}
              onChange={(val) => setLatexCode(val || '')}
              preview={isPreviewMode ? "preview" : "edit"}
              hideToolbar={true}
              visibleDragbar={false}
              height={isMobile && isKeyboardOpen ? Math.min(viewportHeight * 0.3, 200) : 400}
              previewOptions={{
                remarkPlugins: [remarkMath],
                rehypePlugins: [rehypeKatex],
              }}
              textareaProps={{
                placeholder: 'LaTeX код формулы...',
              }}
              style={{
                background: '#151515',
              }}
            />
          </div>
        </div>

        {/* Подсказка */}
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-400">
            💡 Вы можете отредактировать LaTeX код перед вставкой. Используйте $...$ для инлайн формул и $$...$$ для блочных.
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Вставить
          </button>
        </div>
      </div>
    </div>
  )
}

