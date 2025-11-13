import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/verification'
import { generateToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME, USER_DATA_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/lib/cookie-config'

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json()

    // Валидация
    if (!userId || !code) {
      return NextResponse.json(
        { error: 'ID пользователя и код обязательны' },
        { status: 400 }
      )
    }

    // Проверка кода
    const isValid = await verifyCode(userId, code, 'login')
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный или истекший код' },
        { status: 401 }
      )
    }

    // Получение данных пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        login: true,
        role: true,
        status: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверка статуса
    if (user.status === 'banned' || user.status === 'deleted') {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован или удален' },
        { status: 403 }
      )
    }

    // Генерация нового JWT токена
    const token = generateToken({
      userId: user.id,
      login: user.login,
      role: user.role
    })

    // Установка токена в cookies
    const response = NextResponse.json({
      success: true,
      message: 'Код подтвержден успешно',
      token,
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role
      }
    })
    
    // Устанавливаем токен в cookies с параметрами безопасности
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_CONFIG)
    
    // Сохраняем данные пользователя в cookies
    const userData = {
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role
    }
    response.cookies.set(USER_DATA_COOKIE_NAME, JSON.stringify(userData), AUTH_COOKIE_CONFIG)
    
    return response
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

