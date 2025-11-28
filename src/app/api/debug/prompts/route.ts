import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const prompts = await prisma.prompts.findMany({
      where: {
        name: 'improve_text'
      },
      orderBy: {
        language: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: prompts
    })
  } catch (error) {
    console.error('Ошибка получения промптов:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка получения промптов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { language, value } = body

    if (!language || !value) {
      return NextResponse.json(
        { success: false, error: 'Язык и значение обязательны' },
        { status: 400 }
      )
    }

    if (!['ru', 'kg'].includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Неверный язык (ru или kg)' },
        { status: 400 }
      )
    }

    // Создаем или обновляем промпт
    const prompt = await prisma.prompts.upsert({
      where: {
        name_language: {
          name: 'improve_text',
          language: language
        }
      },
      update: {
        value: value
      },
      create: {
        name: 'improve_text',
        language: language,
        value: value
      }
    })

    return NextResponse.json({
      success: true,
      data: prompt
    })
  } catch (error) {
    console.error('Ошибка сохранения промпта:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения промпта' },
      { status: 500 }
    )
  }
}



