import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRecoveryCode, markRecoveryCodeAsUsed } from '@/lib/verification'
import { hashPassword } from '@/lib/auth'
import { generateToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/lib/cookie-config'

export async function POST(request: NextRequest) {
  try {
    const { login, code, newPassword, confirmPassword } = await request.json()

    // Валидация входных данных
    if (!login || !code || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Пароли не совпадают' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8 || newPassword.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Пароль должен содержать от 8 до 50 символов' },
        { status: 400 }
      )
    }

    // Найти пользователя по логину с user_stats
    const user = await prisma.users.findUnique({
      where: { login: login.trim() },
      include: {
        user_stats: true
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

    // Проверить код восстановления
    const verificationResult = await checkRecoveryCode(user.id, code.trim())

    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, error: verificationResult.message },
        { status: 400 }
      )
    }

    if (verificationResult.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Неверный код восстановления' },
        { status: 400 }
      )
    }

    // Хэшировать новый пароль
    const hashedPassword = await hashPassword(newPassword.trim())

    // Обновить пароль пользователя
    await prisma.users.update({
      where: { id: user.id },
      data: { hash_password: hashedPassword }
    })

    // Пометить код как использованный
    await markRecoveryCodeAsUsed(user.id)

    // Генерировать JWT токен (автоматический вход)
    const token = generateToken({
      userId: user.id,
      login: user.login,
      role: user.role
    })

    // Установить httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Пароль успешно сброшен. Вы автоматически вошли в систему.',
      data: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
        status: user.status,
        profilePhoto: user.profile_photo_url,
        language: user.language
      }
    })

    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_CONFIG)

    return response
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

