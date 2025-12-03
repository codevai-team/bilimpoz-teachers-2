import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface JWTPayload {
  userId: string
  login: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Получение токена из запроса (из заголовка Authorization или cookie)
 * Для использования в middleware (Edge Runtime)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Сначала проверяем заголовок Authorization
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim()
  }
  
  // Если нет в заголовке, проверяем cookies
  const cookieToken = request.cookies.get('auth_token')?.value
  if (cookieToken) {
    return cookieToken
  }
  
  return null
}

/**
 * Валидация JWT токена
 * Для использования в middleware (Edge Runtime)
 * Использует jose библиотеку, которая работает в Edge Runtime
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // Проверка формата токена
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null
    }

    // Проверка структуры JWT (должен содержать 3 части через точки)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Создаем секретный ключ из строки
    const secret = new TextEncoder().encode(JWT_SECRET)

    // Верификация токена с помощью jose
    const { payload } = await jwtVerify(token, secret)
    
    // Проверяем, что payload содержит необходимые поля
    if (payload && typeof payload === 'object' && 'userId' in payload && 'login' in payload && 'role' in payload) {
      return payload as unknown as JWTPayload
    }
    
    return null
  } catch (error) {
    // Токен невалиден или истек
    return null
  }
}
