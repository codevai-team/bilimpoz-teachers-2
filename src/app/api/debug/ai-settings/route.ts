import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getOpenAIApiKey, getOpenAIModel } from '@/lib/settings'

export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // Получаем настройки AI
    const apiKey = await getOpenAIApiKey()
    const model = await getOpenAIModel()

    return NextResponse.json({
      success: true,
      data: {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        model: model,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : null
      }
    })

  } catch (error) {
    console.error('Ошибка получения настроек AI:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
