import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/verification'
import { generateToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/lib/cookie-config'

export async function POST(request: NextRequest) {
  try {
    const { login, telegramId, code } = await request.json()

    console.log('Verify code request:', { login, telegramId, code: code ? '***' + code.slice(-2) : 'null' })

    // Валидация входных данных
    if (!login || !telegramId || !code) {
      return NextResponse.json(
        { success: false, error: 'Логин, Telegram ID и код обязательны' },
        { status: 400 }
      )
    }

    // Нормализация данных
    const normalizedLogin = login.trim()
    const normalizedCode = code.trim().replace(/\s/g, '') // Убрать пробелы

    // Найти пользователя по логину
    const user = await prisma.users.findUnique({
      where: { login: normalizedLogin }
    })

    // Проверки
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    if (user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Проверить код верификации
    const verificationResult = await verifyCode(user.id, normalizedCode, 'login')

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: verificationResult.message,
          attemptsLeft: verificationResult.attemptsLeft
        },
        { status: 401 }
      )
    }

    // Повторно получить пользователя с user_stats
    const userWithStats = await prisma.users.findUnique({
      where: { id: user.id },
      include: {
        user_stats: true
      }
    })

    if (!userWithStats) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Дополнительные проверки
    if (userWithStats.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    if (userWithStats.telegram_id !== telegramId) {
      return NextResponse.json(
        { success: false, error: 'Неверный Telegram ID' },
        { status: 401 }
      )
    }

    // Генерировать JWT токен
    const token = generateToken({
      userId: userWithStats.id,
      login: userWithStats.login,
      role: userWithStats.role
    })

    // Установить httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Код подтвержден',
      data: {
        userId: userWithStats.id,
        login: userWithStats.login,
        name: userWithStats.name,
        role: userWithStats.role,
        status: userWithStats.status,
        profilePhoto: userWithStats.profile_photo_url,
        language: userWithStats.language
      }
    })
    
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_CONFIG)
    
    return response
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
