import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/lib/cookie-config'

export async function POST(request: NextRequest) {
  try {
    const { login, telegramData } = await request.json()

    // Валидация входных данных
    if (!login || !telegramData || !telegramData.telegramId) {
      return NextResponse.json(
        { success: false, error: 'Логин и данные Telegram обязательны' },
        { status: 400 }
      )
    }

    // Найти пользователя по логину
    const user = await prisma.users.findUnique({
      where: { login: login.trim() }
    })

    // Проверки
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    if (user.telegram_id) {
      return NextResponse.json(
        { success: false, error: 'Telegram уже подключен' },
        { status: 400 }
      )
    }

    // Проверить уникальность telegram_id
    const existingTelegramUser = await prisma.users.findUnique({
      where: { telegram_id: telegramData.telegramId }
    })

    if (existingTelegramUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Telegram аккаунт уже подключен',
          status: 409
        },
        { status: 409 }
      )
    }

    // Определить URL фото профиля
    let profilePhotoUrl: string | null = null
    if (telegramData.telegramPhoto) {
      // Если фото из Telegram (URL содержит 'telegram.org'), можно сохранить как есть
      // или загрузить в S3 (опционально)
      profilePhotoUrl = telegramData.telegramPhoto
    }

    // Обновить пользователя
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: {
        telegram_id: telegramData.telegramId,
        profile_photo_url: profilePhotoUrl,
        updated_at: new Date()
      }
    })

    // Создать/обновить social_networks
    await prisma.social_networks.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        telegram_login: telegramData.telegramUsername || null
      },
      update: {
        telegram_login: telegramData.telegramUsername || null
      }
    })

    // Если статус = 'registered', генерируем JWT токен для автоматического входа
    let token: string | null = null
    if (updatedUser.status === 'registered') {
      token = generateToken({
        userId: updatedUser.id,
        login: updatedUser.login,
        role: updatedUser.role
      })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Telegram успешно подключен',
      data: {
        id: updatedUser.id,
        login: updatedUser.login,
        name: updatedUser.name,
        telegramId: updatedUser.telegram_id,
        status: updatedUser.status
      }
    })

    // Установить httpOnly cookie с токеном (если был сгенерирован)
    if (token) {
      response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_CONFIG)
    }

    return response
  } catch (error) {
    console.error('Update telegram error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

