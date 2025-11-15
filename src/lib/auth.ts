import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { Prisma, PrismaClientInitializationError } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  userId: string
  login: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Хеширование пароля
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Проверка пароля
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Генерация JWT токена
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Валидация JWT токена
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    // Проверка формата токена
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null
    }

    // Проверка структуры JWT (должен содержать 2 точки)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Верификация токена
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    return payload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('[verifyToken] ✗ Token EXPIRED')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('[verifyToken] ✗ Invalid token')
    }
    return null
  }
}

/**
 * Аутентификация запроса
 */
export async function auth(request: NextRequest) {
  // Извлечение токена из заголовка Authorization
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7) // Убираем "Bearer "
  const payload = verifyToken(token)
  
  if (!payload) {
    return null
  }

  // Получение актуальных данных пользователя из БД
  try {
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        login: true,
        profile_photo_url: true,
        role: true,
        status: true,
        telegram_id: true
      }
    })
    
    if (!user) {
      return null
    }

    // Проверка статуса пользователя
    if (user.status === 'banned' || user.status === 'deleted') {
      return null
    }
    
    return user
  } catch (error) {
    // Обработка ошибок подключения к БД
    if (error instanceof PrismaClientInitializationError || 
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001')) {
      throw new Error('DATABASE_CONNECTION_ERROR')
    }
    throw error
  }
}

/**
 * Хелпер для защищенных роутов
 */
export async function authenticatedHandler(
  request: NextRequest,
  handler: (user: Awaited<ReturnType<typeof auth>>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await auth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    return await handler(user)
  } catch (error) {
    // Обработка ошибок подключения к БД
    if (error instanceof Error && error.message === 'DATABASE_CONNECTION_ERROR') {
      return NextResponse.json(
        { 
          error: 'Не удается подключиться к базе данных...',
          code: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}




