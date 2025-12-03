'use client'

import { useState, useEffect } from 'react'

/**
 * Хук для определения состояния виртуальной клавиатуры на мобильных устройствах
 */
export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Определяем мобильное устройство (улучшенная логика)
    const isMobile = (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      // Дополнительная проверка для современных устройств
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      // Проверка размера экрана
      (window.innerWidth <= 768)
    )

    console.log('🔍 Mobile detection:', {
      userAgent: navigator.userAgent,
      isMobile,
      hasVisualViewport: !!window.visualViewport,
      initialHeight: window.visualViewport?.height || window.innerHeight
    })

    if (!isMobile) return

    // Сохраняем изначальную высоту viewport
    const initialHeight = window.visualViewport?.height || window.innerHeight
    setViewportHeight(initialHeight)

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight
      setViewportHeight(currentHeight)
      
      // Считаем клавиатуру открытой, если высота viewport уменьшилась более чем на 150px
      // Для iOS используем более чувствительный порог
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const threshold = isIOS ? 100 : 150
      const heightDifference = initialHeight - currentHeight
      const keyboardOpen = heightDifference > threshold
      
      console.log('📱 Viewport change:', {
        initialHeight,
        currentHeight,
        heightDifference,
        keyboardOpen
      })
      
      setIsKeyboardOpen(keyboardOpen)
    }

    // Используем Visual Viewport API если доступен (более точный)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange)
      }
    } else {
      // Fallback для старых браузеров
      window.addEventListener('resize', handleViewportChange)
      return () => {
        window.removeEventListener('resize', handleViewportChange)
      }
    }
  }, [])

  return {
    isKeyboardOpen,
    viewportHeight,
    isMobile: typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (window.innerWidth <= 768)
    )
  }
}

