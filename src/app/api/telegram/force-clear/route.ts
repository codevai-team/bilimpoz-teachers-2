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

    console.log('🔄 Принудительная очистка всех Telegram конфликтов...')

    // 1. Удаляем webhook с очисткой pending updates
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true })
    })
    const webhookResult = await webhookResponse.json()
    console.log('Webhook удален:', webhookResult)

    // 2. Делаем несколько getUpdates запросов с большим offset для очистки очереди
    let offset = 0
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        console.log(`Попытка очистки ${attempts + 1}/${maxAttempts}, offset: ${offset}`)
        
        const updatesResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=1&limit=100`
        )
        const updatesResult = await updatesResponse.json()
        
        if (updatesResult.ok && updatesResult.result.length > 0) {
          const lastUpdate = updatesResult.result[updatesResult.result.length - 1]
          offset = lastUpdate.update_id + 1
          console.log(`Очищено ${updatesResult.result.length} обновлений, новый offset: ${offset}`)
        } else if (updatesResult.ok) {
          console.log('Очередь обновлений пуста')
          break
        } else {
          console.log('Ошибка при получении обновлений:', updatesResult.description)
          if (updatesResult.description?.toLowerCase().includes('conflict')) {
            console.log('⚠️ Обнаружен конфликт - другой процесс использует getUpdates')
            // Ждем немного и пробуем снова
            await new Promise(resolve => setTimeout(resolve, 2000))
          } else {
            break
          }
        }
        
        attempts++
        
        // Небольшая задержка между запросами
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('Ошибка при очистке:', error)
        attempts++
      }
    }

    // 3. Финальная проверка
    const finalCheck = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const finalResult = await finalCheck.json()

    return NextResponse.json({
      success: true,
      message: 'Принудительная очистка завершена',
      data: {
        webhook: webhookResult,
        finalOffset: offset,
        attempts: attempts,
        finalWebhookInfo: finalResult.result
      }
    })
  } catch (error) {
    console.error('Error in force clear:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка принудительной очистки' },
      { status: 500 }
    )
  }
}
