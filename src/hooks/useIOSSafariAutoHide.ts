'use client'

import { useEffect } from 'react'

/**
 * Хук для автоматического скрытия адресной строки в iOS Safari
 * при загрузке страницы и при прокрутке вверх
 */
export function useIOSSafariAutoHide() {
  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return

    // Определяем iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (!isIOS || !isSafari) return

    // Функция для программной прокрутки, которая скрывает адресную строку
    const hideAddressBar = () => {
      // Прокручиваем на 1px вниз, чтобы скрыть адресную строку
      window.scrollTo(0, 1)
    }

    // Скрываем адресную строку после загрузки страницы
    const hideOnLoad = () => {
      // Небольшая задержка для корректной работы
      setTimeout(() => {
        hideAddressBar()
      }, 100)
    }

    // Вызываем при загрузке страницы
    if (document.readyState === 'complete') {
      hideOnLoad()
    } else {
      window.addEventListener('load', hideOnLoad)
    }

    // Отслеживаем изменение ориентации устройства
    const handleOrientationChange = () => {
      setTimeout(() => {
        hideAddressBar()
      }, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)

    // Очистка слушателей при размонтировании
    return () => {
      window.removeEventListener('load', hideOnLoad)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])
}








