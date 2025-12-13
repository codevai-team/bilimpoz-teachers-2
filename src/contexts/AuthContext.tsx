'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { apiRequest, removeAuthToken, setAuthToken, getUserCookie, setUserCookie } from '@/lib/client-auth'

interface User {
  id: string
  name: string
  login: string
  profile_photo_url?: string | null
  role: string
  status: string
  telegram_id?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async (showLoading = true) => {
    setLoading(showLoading)
    setError(null)

    // Проверяем данные пользователя в cookies для быстрого отображения
    const cachedUser = getUserCookie()
    if (cachedUser) {
      setUser(cachedUser)
      // Также сохраняем в localStorage для совместимости
      localStorage.setItem('user', JSON.stringify(cachedUser))
    }

    // Проверка актуальности данных через API
    try {
      const response = await apiRequest('/api/user/me')
      
      if (response.ok) {
        const currentUser = await response.json()
        
        // Проверка статуса пользователя - если забанен, автоматически выходим
        if (currentUser.status === 'banned' || currentUser.status === 'deleted') {
          // Очищаем данные и перенаправляем на страницу логина
          removeAuthToken()
          setUser(null)
          setError(null)
          window.location.href = '/login?error=banned'
          return
        }
        
        setUser(currentUser)
        // Сохраняем в cookies и localStorage
        setUserCookie(currentUser)
        localStorage.setItem('user', JSON.stringify(currentUser))
        setError(null)
      } else if (response.status === 401) {
        // Токен истек или невалиден
        removeAuthToken()
        setUser(null)
        setError('Сессия истекла')
      } else if (response.status === 403) {
        // Нет прав доступа
        setError('Доступ запрещен')
      } else if (response.status === 503) {
        // Проблемы с БД
        setError('Сервис временно недоступен')
      } else {
        setUser(null)
        setError('Ошибка загрузки данных')
      }
    } catch (err) {
      console.error('Error loading user:', err)
      // Если есть кэшированные данные, не показываем ошибку
      if (!cachedUser) {
        setUser(null)
        setError('Ошибка подключения к серверу')
      }
    }
    
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Очистка данных в любом случае
      removeAuthToken()
      setUser(null)
      setError(null)
      window.location.href = '/login'
    }
  }, [])

  const refreshUser = useCallback(async () => {
    await loadUser(true)
  }, [loadUser])

  // Загрузка пользователя при монтировании (только один раз)
  useEffect(() => {
    loadUser(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

