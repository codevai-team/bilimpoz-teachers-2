import { NextResponse } from 'next/server'
import { getTeacherBotToken } from '@/lib/settings'

export async function GET() {
  try {
    const botToken = await getTeacherBotToken()
    
    if (!botToken) {
      return NextResponse.json({
        success: false,
        message: 'TEACHER_BOT_TOKEN не установлен'
      }, { status: 400 })
    }

    // Получаем информацию о боте
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    const botInfo = await botInfoResponse.json()

    // Получаем последние обновления (только если polling не активен)
    let updates: any = { ok: true, result: [] }
    try {
      // Проверяем статус polling
      const { telegramPolling } = await import('@/lib/telegram-polling')
      if (!telegramPolling.isActive) {
        const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=5&timeout=1`)
        updates = await updatesResponse.json()
      } else {
        // Если polling активен, не делаем запрос getUpdates
        updates = { ok: true, result: [], message: 'Polling активен - обновления недоступны' }
      }
    } catch (error) {
      console.warn('Не удалось проверить статус polling:', error)
      updates = { ok: false, result: [], error: 'Не удалось получить обновления' }
    }

    // Проверяем webhook
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const webhookInfo = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      data: {
        botInfo: botInfo.result,
        recentUpdates: updates.result || [],
        webhookInfo: webhookInfo.result,
        tokenValid: botInfo.ok
      }
    })
  } catch (error) {
    console.error('Error getting bot info:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка получения информации о боте' },
      { status: 500 }
    )
  }
}

