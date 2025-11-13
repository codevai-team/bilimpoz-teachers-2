import { prisma } from './prisma'

class TelegramService {
  private botToken: string | null = null

  /**
   * Получение токена бота из базы данных
   */
  async getBotToken(tokenType: 'ADMIN_BOT_TOKEN' | 'STUDENT_BOT_TOKEN' = 'ADMIN_BOT_TOKEN'): Promise<string> {
    // Кэширование для ADMIN_BOT_TOKEN
    if (tokenType === 'ADMIN_BOT_TOKEN' && this.botToken) {
      return this.botToken
    }

    // Получение из базы данных
    const setting = await prisma.settings.findUnique({
      where: { key: tokenType }
    })

    if (!setting?.value) {
      throw new Error(`Telegram bot token not found in settings for ${tokenType}`)
    }

    // Кэширование
    if (tokenType === 'ADMIN_BOT_TOKEN') {
      this.botToken = setting.value
    }
    
    return setting.value
  }

  /**
   * Отправка сообщения в Telegram
   */
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const botToken = await this.getBotToken('ADMIN_BOT_TOKEN')
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Telegram API error:', result)
        return false
      }

      return result.ok
    } catch (error) {
      console.error('Error sending Telegram message:', error)
      return false
    }
  }

  /**
   * Отправка кода подтверждения в Telegram
   */
  async sendVerificationCode(telegramId: string, code: string): Promise<boolean> {
    const message = `🔐 *Код подтверждения входа*

Ваш код: \`${code}\`

Введите этот код на странице авторизации для завершения входа в систему.

⏰ Код действителен в течение 5 минут.`

    return await this.sendMessage(telegramId, message)
  }

  /**
   * Отправка рассылки
   */
  async sendBroadcast(
    telegramIds: string[], 
    message: string, 
    options?: {
      ctaText?: string;
      ctaLink?: string;
      parseMode?: 'Markdown' | 'HTML';
    }
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ telegramId: string; error: string }>;
  }> {
    const botToken = await this.getBotToken('STUDENT_BOT_TOKEN')
    
    let success = 0
    let failed = 0
    const errors: Array<{ telegramId: string; error: string }> = []

    // Формирование сообщения с кнопкой (если есть CTA)
    let messageText = message
    if (options?.ctaText && options?.ctaLink) {
      messageText += `\n\n[${options.ctaText}](${options.ctaLink})`
    }

    // Отправка пакетами (30 сообщений в секунду - лимит Telegram API)
    const batchSize = 30
    const delay = 1000 // 1 секунда между пакетами

    for (let i = 0; i < telegramIds.length; i += batchSize) {
      const batch = telegramIds.slice(i, i + batchSize)
      
      // Параллельная отправка пакета
      const promises = batch.map(async (telegramId) => {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: telegramId,
              text: messageText,
              parse_mode: options?.parseMode || 'Markdown',
              disable_web_page_preview: false,
              ...(options?.ctaText && options?.ctaLink ? {
                reply_markup: {
                  inline_keyboard: [[
                    {
                      text: options.ctaText,
                      url: options.ctaLink
                    }
                  ]]
                }
              } : {})
            }),
          })

          const result = await response.json()
          
          if (!response.ok || !result.ok) {
            failed++
            errors.push({
              telegramId,
              error: result.description || result.error_code || 'Unknown error'
            })
            return false
          }

          success++
          return true
        } catch (error: any) {
          failed++
          errors.push({
            telegramId,
            error: error.message || 'Network error'
          })
          return false
        }
      })

      await Promise.all(promises)

      // Задержка между пакетами (кроме последнего)
      if (i + batchSize < telegramIds.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { success, failed, errors }
  }
}

export const telegramService = new TelegramService()


