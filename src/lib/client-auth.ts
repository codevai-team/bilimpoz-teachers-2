/**
 * Клиентские утилиты для работы с аутентификацией
 */

import { AUTH_COOKIE_NAME, USER_DATA_COOKIE_NAME, getClientCookieConfig } from './cookie-config'

/**
 * Получение токена из cookies
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Получаем токен только из cookies (единственный источник правды)
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`))
  
  if (authCookie) {
    const token = authCookie.split('=')[1]
    return token
  }
  
  return null
}

/**
 * Установка токена в cookies
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  
  // Получаем конфигурацию для клиентской установки cookie
  const config = getClientCookieConfig()
  
  // Формируем cookie строку с правильными параметрами безопасности
  let cookieString = `${AUTH_COOKIE_NAME}=${token}; path=${config.path}; max-age=${config.maxAge}; samesite=${config.sameSite}`
  if (config.secure) {
    cookieString += '; secure'
  }
  
  document.cookie = cookieString
}

/**
 * Удаление токена из cookies
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  
  // Получаем конфигурацию для правильного удаления cookie
  const config = getClientCookieConfig()
  
  // Удаляем cookie с теми же параметрами безопасности, что и при установке
  // Это важно для правильного удаления cookie с secure и sameSite флагами
  let cookieString = `${AUTH_COOKIE_NAME}=; path=${config.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=${config.sameSite}`
  if (config.secure) {
    cookieString += '; secure'
  }
  
  document.cookie = cookieString
  localStorage.removeItem('user')
  removeUserCookie()
}

/**
 * Получение заголовков для API запросов
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  
  if (!token) {
    return {
      'Content-Type': 'application/json',
    }
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Универсальный запрос к API
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Сохранение данных пользователя в cookies
 */
export function setUserCookie(user: any): void {
  if (typeof window === 'undefined') return
  
  const config = getClientCookieConfig()
  const userData = JSON.stringify(user)
  
  // Сохраняем данные пользователя в cookie
  let cookieString = `${USER_DATA_COOKIE_NAME}=${encodeURIComponent(userData)}; path=${config.path}; max-age=${config.maxAge}; samesite=${config.sameSite}`
  if (config.secure) {
    cookieString += '; secure'
  }
  
  document.cookie = cookieString
}

/**
 * Получение данных пользователя из cookies
 */
export function getUserCookie(): any | null {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const userCookie = cookies.find(cookie => cookie.trim().startsWith(`${USER_DATA_COOKIE_NAME}=`))
  
  if (userCookie) {
    try {
      const userData = decodeURIComponent(userCookie.split('=')[1])
      return JSON.parse(userData)
    } catch (e) {
      return null
    }
  }
  
  return null
}

/**
 * Удаление данных пользователя из cookies
 */
export function removeUserCookie(): void {
  if (typeof window === 'undefined') return
  
  const config = getClientCookieConfig()
  let cookieString = `${USER_DATA_COOKIE_NAME}=; path=${config.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=${config.sameSite}`
  if (config.secure) {
    cookieString += '; secure'
  }
  
  document.cookie = cookieString
}

