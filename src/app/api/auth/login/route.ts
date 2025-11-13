import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { generateVerificationCode, storeVerificationCode } from '@/lib/verification'
import { telegramService } from '@/lib/telegram'
import { AUTH_COOKIE_NAME, USER_DATA_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/lib/cookie-config'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()

    // Валидация входных данных
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    // Поиск пользователя в базе данных
    const user = await prisma.users.findUnique({
      where: { login: login },
      select: {
        id: true,
        name: true,
        login: true,
        hash_password: true,
        role: true,
        status: true,
        telegram_id: true
      }
    })

    // Проверка существования пользователя
    if (!user) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Проверка статуса пользователя
    if (user.status === 'banned' || user.status === 'deleted') {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован или удален' },
        { status: 403 }
      )
    }

    // Проверка пароля
    const isPasswordValid = await verifyPassword(password, user.hash_password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Генерация JWT токена
    const token = generateToken({
      userId: user.id,
      login: user.login,
      role: user.role
    })

    // Удаляем пароль из ответа
    const { hash_password, ...userWithoutPassword } = user

    // Проверка наличия Telegram ID
    if (!user.telegram_id) {
      // У пользователя нет Telegram ID - требуется привязка
      const response = NextResponse.json({
        success: true,
        user: userWithoutPassword,
        token: token,
        message: 'Авторизация успешна',
        requiresTelegramVerification: true
      })
      
      // Устанавливаем токен в cookies с параметрами безопасности
      response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_CONFIG)
      
      // Сохраняем данные пользователя в cookies
      response.cookies.set(USER_DATA_COOKIE_NAME, JSON.stringify(userWithoutPassword), AUTH_COOKIE_CONFIG)
      
      return response
    }

    // У пользователя есть Telegram ID - двухфакторная аутентификация
    // Генерируем и сохраняем код подтверждения
    const verificationCode = generateVerificationCode()
    await storeVerificationCode(user.id, verificationCode, 'login')

    // Отправляем код в Telegram
    const messageSent = await telegramService.sendVerificationCode(
      user.telegram_id, 
      verificationCode
    )

    if (!messageSent) {
      return NextResponse.json({
        error: 'Ошибка отправки кода в Telegram'
      }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token: token,
      message: 'Код подтверждения отправлен в Telegram',
      requiresVerification: true
    })

    // Устанавливаем токен в cookies с параметрами безопасности
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_CONFIG)
    
    // Сохраняем данные пользователя в cookies
    response.cookies.set(USER_DATA_COOKIE_NAME, JSON.stringify(userWithoutPassword), AUTH_COOKIE_CONFIG)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

