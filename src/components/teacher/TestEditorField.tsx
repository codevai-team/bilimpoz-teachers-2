'use client'

import React, { useState, useEffect, useRef, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import '@uiw/react-md-editor/markdown-editor.css'

// Динамический импорт MDEditor для избежания SSR проблем
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false
})

interface TestEditorFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
  isPreviewMode?: boolean
  onFocus?: () => void
  showResizeHandle?: boolean
  hasError?: boolean
}

const TestEditorField = forwardRef<HTMLDivElement, TestEditorFieldProps>(
  (
    {
      value,
      onChange,
      placeholder = '',
      height = 150,
      isPreviewMode = false,
      onFocus,
      showResizeHandle = false,
      hasError = false
    },
    ref
  ) => {
    const [currentHeight, setCurrentHeight] = useState(height)
    const [isResizing, setIsResizing] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const startYRef = useRef(0)
    const startHeightRef = useRef(height)
    const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark')
    
    // Определяем тему из data-theme атрибута
    useEffect(() => {
      const updateColorMode = () => {
        const theme = document.documentElement.getAttribute('data-theme')
        setColorMode(theme === 'light' ? 'light' : 'dark')
      }
      
      updateColorMode()
      
      // Отслеживаем изменения темы
      const observer = new MutationObserver(updateColorMode)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      })
      
      return () => observer.disconnect()
    }, [])

    // Обновляем высоту при изменении prop height
    useEffect(() => {
      setCurrentHeight(height)
      startHeightRef.current = height
    }, [height])

    // Обработчик начала изменения размера
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      startYRef.current = e.clientY
      startHeightRef.current = currentHeight
    }

    // Отслеживание движения мыши при изменении размера
    useEffect(() => {
      if (!isResizing) return

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startYRef.current
        const newHeight = Math.max(60, Math.min(500, startHeightRef.current + deltaY))
        setCurrentHeight(newHeight)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isResizing])

    // Активация поля при клике
    const handleClick = () => {
      if (!isActive) {
        setIsActive(true)
        if (onFocus) {
          onFocus()
        }
        
        // Фокусируем textarea после активации
        setTimeout(() => {
          const textarea = containerRef.current?.querySelector('textarea')
          if (textarea) {
            textarea.focus()
          }
        }, 0)
      }
    }

    // Деактивация при клике вне поля
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsActive(false)
        }
      }

      if (isActive) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isActive])

    // Управление скроллом
    useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
        if (!isActive) {
          return
        }
        
        const target = e.target as HTMLElement
        const textarea = containerRef.current?.querySelector('textarea')
        const preview = containerRef.current?.querySelector('.w-md-editor-preview')
        
        if (textarea && (target === textarea || textarea.contains(target))) {
          const isAtTop = textarea.scrollTop === 0
          const isAtBottom = textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight
          
          if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
            return
          }
        } else if (preview && (target === preview || preview.contains(target))) {
          const isAtTop = preview.scrollTop === 0
          const isAtBottom = preview.scrollTop + preview.clientHeight >= preview.scrollHeight
          
          if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
            return
          }
        }
      }

      const container = containerRef.current
      if (container) {
        container.addEventListener('wheel', handleWheel, { passive: true })
      }

      return () => {
        if (container) {
          container.removeEventListener('wheel', handleWheel)
        }
      }
    }, [isActive])

    // Скрытие scrollbar'ов
    useEffect(() => {
      const styleId = 'test-editor-field-scrollbar-styles'
      let style = document.getElementById(styleId) as HTMLStyleElement
      
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          .w-md-editor,
          .w-md-editor * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .w-md-editor::-webkit-scrollbar,
          .w-md-editor *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .w-md-editor-text-pre {
            overflow-y: auto !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .w-md-editor-text-pre::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .w-md-editor-text-area,
          .w-md-editor-text-area * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .w-md-editor-text-area::-webkit-scrollbar,
          .w-md-editor-text-area *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .w-md-editor-preview,
          .w-md-editor-preview * {
            background: var(--bg-card) !important;
          }
          .w-md-editor-preview {
            background-color: var(--bg-card) !important;
          }
        `
        document.head.appendChild(style)
      }
    }, [])

    // Применение стилей к элементам
    useEffect(() => {
      const hideScrollbars = () => {
        if (containerRef.current) {
          const allElements = containerRef.current.querySelectorAll('*')
          allElements.forEach((el: any) => {
            if (el && el.style) {
              el.style.scrollbarWidth = 'none'
              el.style.msOverflowStyle = 'none'
            }
          })
        }
      }

      const timeout = setTimeout(hideScrollbars, 50)
      return () => clearTimeout(timeout)
    }, [currentHeight, value])

    return (
      <div
        ref={containerRef}
        className="relative h-full flex flex-col"
        onClick={handleClick}
      >
        <div
          style={{
            pointerEvents: isActive ? 'auto' : 'none',
            borderColor: hasError ? '#ef4444' : isActive ? '#ffffff' : '#374151',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          className="rounded-xl border transition-colors flex-1 min-h-0"
        >
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            preview={isPreviewMode ? 'preview' : 'edit'}
            hideToolbar={true}
            visibleDragbar={false}
            height={currentHeight}
            data-color-mode={colorMode}
            previewOptions={{
              remarkPlugins: [remarkMath],
              rehypePlugins: [rehypeKatex]
            }}
            textareaProps={{
              placeholder
            }}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        
        {/* Кнопка изменения размера */}
        {showResizeHandle && (
          <div
            className="absolute bottom-1 right-1 cursor-se-resize hover:opacity-80 transition-opacity z-10"
            onMouseDown={handleMouseDown}
          >
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path d="M20 20L16 16M20 20L16 20M20 20L20 16" />
            </svg>
          </div>
        )}
      </div>
    )
  }
)

TestEditorField.displayName = 'TestEditorField'

export default TestEditorField

