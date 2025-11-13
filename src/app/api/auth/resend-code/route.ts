import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, storeVerificationCode } from '@/lib/verification'
import { telegramService } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Валидация
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Получение пользователя
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        telegram_id: true,
        status: true
      }
    })

    // Проверки
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    if (!user.telegram_id) {
      return NextResponse.json(
        { error: 'У пользователя не привязан Telegram' },
        { status: 400 }
      )
    }

    if (user.status === 'banned' || user.status === 'deleted') {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован или удален' },
        { status: 403 }
      )
    }

    // Генерация нового кода
    const verificationCode = generateVerificationCode()
    await storeVerificationCode(user.id, verificationCode, 'login')

    // Отправка в Telegram
    const messageSent = await telegramService.sendVerificationCode(
      user.telegram_id, 
      verificationCode
    )
    
    if (!messageSent) {
      return NextResponse.json({
        error: 'Ошибка отправки кода в Telegram'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Новый код подтверждения отправлен в Telegram'
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}


