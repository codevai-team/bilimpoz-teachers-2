import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { apiKey, model } = body

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API ключ обязателен' },
        { status: 400 }
      )
    }

    // Сохраняем API ключ
    await prisma.settings.upsert({
      where: { key: 'OPENAI_API_KEY' },
      update: {
        value: apiKey,
        updated_at: new Date()
      },
      create: {
        key: 'OPENAI_API_KEY',
        value: apiKey
      }
    })

    // Сохраняем модель, если указана
    if (model && typeof model === 'string') {
      await prisma.settings.upsert({
        where: { key: 'OPENAI_API_MODELS' },
        update: {
          value: model,
          updated_at: new Date()
        },
        create: {
          key: 'OPENAI_API_MODELS',
          value: model
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Настройки AI обновлены'
    })

  } catch (error) {
    console.error('Ошибка сохранения настроек AI:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
