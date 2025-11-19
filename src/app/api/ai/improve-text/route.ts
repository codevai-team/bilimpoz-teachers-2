import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { openAIService } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // 2. Парсинг тела запроса
    const body = await request.json()
    const { text, courseLanguage } = body

    // 3. Валидация
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Текст обязателен' },
        { status: 400 }
      )
    }

    if (!courseLanguage || !['kg', 'ru'].includes(courseLanguage)) {
      return NextResponse.json(
        { error: 'Некорректный язык курса' },
        { status: 400 }
      )
    }

    // 4. Ограничение длины (максимум 5000 символов)
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Текст слишком длинный (максимум 5000 символов)' },
        { status: 400 }
      )
    }

    // 5. Вызов AI сервиса
    let improvedText: string
    try {
      improvedText = await openAIService.improveText(text.trim(), courseLanguage as 'kg' | 'ru')
    } catch (error) {
      console.error('Ошибка OpenAI API:', error)
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return NextResponse.json(
            { error: 'OpenAI API key не настроен. Обратитесь к администратору.' },
            { status: 503 }
          )
        }
        throw error
      }
      throw new Error('Ошибка при улучшении текста')
    }

    // 6. Возврат результата
    return NextResponse.json({
      success: true,
      improvedText
    })

  } catch (error) {
    console.error('Ошибка API улучшения текста:', error)
    
    let errorMessage = 'Внутренняя ошибка сервера'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      if (error.message.includes('OpenAI API key')) {
        statusCode = 503 // Service Unavailable
      } else if (error.message.includes('промпты')) {
        statusCode = 503
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

