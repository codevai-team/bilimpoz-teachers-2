/**
 * Конфигурация безопасности для cookies аутентификации
 */

export const AUTH_COOKIE_NAME = 'auth-token'
export const USER_DATA_COOKIE_NAME = 'user-data'

export const AUTH_COOKIE_CONFIG = {
  httpOnly: false, // Нужно для доступа из JavaScript на клиенте
  secure: process.env.NODE_ENV === 'production', // HTTPS только в production
  sameSite: 'lax' as const, // Защита от CSRF, но позволяет переходы по ссылкам
  maxAge: 7 * 24 * 60 * 60, // 7 дней (в секундах)
  path: '/' // Доступно для всех путей приложения
}

/**
 * Получение параметров cookie для клиентской установки
 */
export function getClientCookieConfig(): { maxAge: number; path: string; sameSite: string; secure?: boolean } {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  
  return {
    maxAge: AUTH_COOKIE_CONFIG.maxAge,
    path: AUTH_COOKIE_CONFIG.path,
    sameSite: AUTH_COOKIE_CONFIG.sameSite,
    ...(isSecure && { secure: true })
  }
}

