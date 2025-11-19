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
    const { imageBase64 } = body

    // 3. Валидация
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Изображение в формате base64 обязательно' },
        { status: 400 }
      )
    }

    // Проверка размера base64 строки (примерно 5MB в base64)
    const maxBase64Size = 7 * 1024 * 1024 // ~5MB в base64
    if (imageBase64.length > maxBase64Size) {
      return NextResponse.json(
        { error: 'Размер изображения слишком большой (максимум 5MB)' },
        { status: 400 }
      )
    }

    // 4. Вызов AI сервиса для конвертации изображения в LaTeX
    let latexCode: string
    try {
      latexCode = await openAIService.convertImageToLatex(imageBase64)
    } catch (error) {
      console.error('Ошибка OpenAI API:', error)
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return NextResponse.json(
            { error: 'OpenAI API key не настроен. Обратитесь к администратору.' },
            { status: 503 }
          )
        }
        if (error.message.includes('vision') || error.message.includes('image')) {
          return NextResponse.json(
            { error: 'Модель не поддерживает обработку изображений. Используйте модель с поддержкой vision.' },
            { status: 503 }
          )
        }
        throw error
      }
      throw new Error('Ошибка при конвертации изображения')
    }

    // 5. Возврат результата
    return NextResponse.json({
      success: true,
      latexCode
    })

  } catch (error) {
    console.error('Ошибка API конвертации изображения в LaTeX:', error)
    
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

