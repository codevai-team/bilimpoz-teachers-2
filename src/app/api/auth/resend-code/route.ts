import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canRequestNewCode } from '@/lib/verification'
import { telegramPolling } from '@/lib/telegram-polling'

export async function POST(request: NextRequest) {
  try {
    const { login, telegramId, language } = await request.json()

    // Валидация
    if (!login || !telegramId) {
      return NextResponse.json(
        { success: false, error: 'Логин и Telegram ID обязательны' },
        { status: 400 }
      )
    }

    // Получение пользователя
    const user = await prisma.users.findUnique({
      where: { login: login.trim() },
      select: {
        id: true,
        name: true,
        login: true,
        telegram_id: true,
        status: true,
        role: true
      }
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

    if (!user.telegram_id) {
      return NextResponse.json(
        { success: false, error: 'У пользователя не привязан Telegram' },
        { status: 400 }
      )
    }

    if (user.telegram_id !== telegramId) {
      return NextResponse.json(
        { success: false, error: 'Неверный Telegram ID' },
        { status: 400 }
      )
    }

    if (user.status === 'banned' || user.status === 'deleted') {
      return NextResponse.json(
        { success: false, error: 'Аккаунт заблокирован или удален' },
        { status: 403 }
      )
    }

    // Проверка cooldown
    const cooldownCheck = await canRequestNewCode(user.id)
    if (!cooldownCheck.canRequest) {
      return NextResponse.json(
        {
          success: false,
          message: cooldownCheck.message || 'Подождите перед запросом нового кода',
          cooldownSeconds: cooldownCheck.cooldownSeconds
        },
        { status: 429 }
      )
    }

    // Отправка в Telegram (код генерируется внутри метода)
    const sendResult = await telegramPolling.sendVerificationCode(
      user.login,
      user.telegram_id,
      language || 'ru'
    )

    if (sendResult.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          message: 'Бот заблокирован',
          code: 'BOT_BLOCKED',
          instructions: {
            title: 'Бот заблокирован',
            message: 'Пожалуйста, разблокируйте бота в Telegram и попробуйте снова.'
          }
        },
        { status: 403 }
      )
    }

    if (!sendResult.success) {
      return NextResponse.json(
        { success: false, error: 'Ошибка отправки кода в Telegram' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Новый код подтверждения отправлен в Telegram',
      data: {
        codeSent: true,
        telegramId: user.telegram_id,
        expiresIn: 300
      }
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

