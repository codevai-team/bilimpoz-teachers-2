'use client'

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  isInitialized: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Инициализируем тему из localStorage сразу (синхронно)
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const savedTheme = localStorage.getItem('bilimpoz-theme') as 'light' | 'dark' | null
      // Тёмная тема по умолчанию, если данных нет
      return savedTheme || 'dark'
    } catch {
      return 'dark'
    }
  }

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') {
      setIsInitialized(true)
      return
    }

    // Устанавливаем тему сразу из localStorage
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
        setIsInitialized(true)
  }, [])

  const toggleTheme = useCallback(() => {
      const newTheme = theme === 'light' ? 'dark' : 'light'
      setTheme(newTheme)
      try {
        localStorage.setItem('bilimpoz-theme', newTheme)
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme)
        }
      } catch (error) {
        console.error('Failed to save theme:', error)
      }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isInitialized }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
