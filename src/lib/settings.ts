import { prisma } from './prisma'

/**
 * Получение настройки из БД
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key }
    })
    return setting?.value || defaultValue || null
  } catch (error) {
    console.error(`❌ Ошибка получения настройки ${key}:`, error)
    return defaultValue || null
  }
}

/**
 * Получение токена бота учителя из БД
 */
export async function getTeacherBotToken(): Promise<string | null> {
  return await getSetting('TEACHER_BOT_TOKEN_2')
}

/**
 * Получение URL сайта учителя
 */
export async function getTeacherSiteUrl(): Promise<string> {
  const siteUrl = await getSetting('TEACHER_SITE_URL', 'https://teacher.bilimpoz.kg')
  return siteUrl || 'https://teacher.bilimpoz.kg'
}

/**
 * Получение username бота учителя
 */
export async function getTeacherBotUsername(): Promise<string | null> {
  return await getSetting('TEACHER_BOT_USERNAME_2')
}

/**
 * Получение Telegram логина администратора
 */
export async function getAdminTelegramLogin(): Promise<string | null> {
  const possibleKeys = [
    'TELEGRAM_LOGIN_ADMIN',
    'ADMIN_TELEGRAM_LOGIN',
    'admin_telegram_login',
    'ADMIN_TELEGRAM',
    'admin_telegram'
  ]
  
  for (const key of possibleKeys) {
    const login = await getSetting(key)
    if (login) {
      return login
    }
  }
  
  return null
}

/**
 * Получение сообщений верификации из БД
 */
export async function getVerificationMessages(): Promise<{
  ru: Record<string, string>
  kg: Record<string, string>
} | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'TELEGRAM_VERIFICATION_MESSAGES' }
    })
    
    if (!setting?.value) {
      console.warn('⚠️ Сообщения верификации не найдены в БД')
      return null
    }
    
    try {
      const parsed = JSON.parse(setting.value)
      
      // Валидация структуры
      if (!parsed.ru || !parsed.kg || typeof parsed.ru !== 'object' || typeof parsed.kg !== 'object') {
        console.error('❌ Неверная структура сообщений в БД')
        return null
      }
      
      return parsed
    } catch (jsonError) {
      console.error('❌ Ошибка парсинга JSON сообщений верификации:', jsonError)
      console.error('📄 Поврежденный JSON (первые 500 символов):', setting.value.substring(0, 500))
      return null
    }
  } catch (error) {
    console.error('❌ Ошибка получения сообщений верификации из БД:', error)
    return null
  }
}

/**
 * Обновление сообщений верификации в БД
 */
export async function updateVerificationMessages(messages: {
  ru: Record<string, string>
  kg: Record<string, string>
}): Promise<boolean> {
  try {
    const value = JSON.stringify(messages, null, 2)
    
    await prisma.settings.upsert({
      where: { key: 'TELEGRAM_VERIFICATION_MESSAGES' },
      update: {
        value,
        updated_at: new Date()
      },
      create: {
        key: 'TELEGRAM_VERIFICATION_MESSAGES',
        value
      }
    })
    
    return true
  } catch (error) {
    console.error('❌ Ошибка обновления сообщений верификации:', error)
    return false
  }
}

/**
 * Получение OpenAI API ключа из БД
 */
export async function getOpenAIApiKey(): Promise<string | null> {
  return await getSetting('OPENAI_API_KEY')
}

/**
 * Получение модели OpenAI из БД
 */
export async function getOpenAIModel(): Promise<string> {
  const model = await getSetting('OPENAI_API_MODELS', 'gpt-4o-mini')
  // Если в БД хранится JSON массив, парсим его
  try {
    const parsed = JSON.parse(model || '')
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0] // Берем первую модель из списка
    }
  } catch {
    // Если не JSON, возвращаем как есть
  }
  return model || 'gpt-4o-mini'
}

