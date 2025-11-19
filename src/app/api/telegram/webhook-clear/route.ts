import { NextResponse } from 'next/server'
import { getTeacherBotToken } from '@/lib/settings'

export async function POST() {
  try {
    const botToken = await getTeacherBotToken()
    
    if (!botToken) {
      return NextResponse.json({
        success: false,
        message: 'TEACHER_BOT_TOKEN не установлен'
      }, { status: 400 })
    }

    // Получаем информацию о webhook
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const webhookInfo = await webhookInfoResponse.json()

    console.log('Текущий webhook:', webhookInfo)

    // Удаляем webhook с очисткой pending updates
    const deleteResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        drop_pending_updates: true 
      })
    })
    
    const deleteResult = await deleteResponse.json()
    console.log('Результат удаления webhook:', deleteResult)

    // Проверяем, что webhook действительно удален
    const verifyResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const verifyInfo = await verifyResponse.json()

    return NextResponse.json({
      success: true,
      data: {
        previousWebhook: webhookInfo.result,
        deleteResult: deleteResult,
        currentWebhook: verifyInfo.result
      }
    })
  } catch (error) {
    console.error('Error clearing webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка очистки webhook' },
      { status: 500 }
    )
  }
}
