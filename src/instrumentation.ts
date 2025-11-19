export async function register() {
  // Этот код выполняется только на сервере при старте Next.js
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Динамически импортируем для избежания проблем с SSR
      const { telegramPolling } = await import('@/lib/telegram-polling')
      const { getTeacherBotToken } = await import('@/lib/settings')
      
      // Проверяем наличие токена бота в БД
      const botToken = await getTeacherBotToken()
      if (botToken) {
        console.log('🔧 Telegram bot token найден')
        console.log('💡 Для запуска polling используйте: POST /api/telegram/polling-control с action: "start"')
        console.log('💡 Для остановки polling используйте: POST /api/telegram/polling-control с action: "stop"')
      } else {
        console.warn('⚠️ TEACHER_BOT_TOKEN не установлен в БД')
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке Telegram polling:', error)
    }
  }
}

