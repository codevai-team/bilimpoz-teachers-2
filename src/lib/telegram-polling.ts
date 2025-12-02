import { prisma } from './prisma'
import { getTeacherBotToken, getTeacherSiteUrl, getAdminTelegramLogin, getTeacherBotUsername, getVerificationMessages } from './settings'
import { generateAndStoreVerificationCode } from './verification'
import { isS3Url, isTelegramUrl } from './s3'

// Дефолтные сообщения (используются как fallback)
const defaultMessages = {
  ru: {
    welcome: '👋 Добро пожаловать в BilimPoz Teacher!',
    unknownCommand: '❌ Неизвестная команда. Используйте /start для начала работы.',
    userNotFound: '❌ Пользователь не найден. Проверьте правильность ссылки.',
    alreadyConnected: '✅ Ваш Telegram уже подключен к аккаунту.',
    connectionSuccess: '✅ Telegram успешно подключен!',
    welcomeUser: (name: string) => `👋 Добро пожаловать, ${name}!`,
    connectionSuccessVerified: '🎉 Вы можете войти на сайт и начать работу.',
    verificationRequired: '📋 *Требуется верификация аккаунта*',
    whatIsVerification: '❓ *Что такое верификация?*',
    verificationDescription: 'Верификация - это подтверждение вашей личности администратором системы. После верификации вы получите полный доступ ко всем функциям.',
    howToVerify: '📝 *Как пройти верификацию?*',
    verifyStep1: '1️⃣ Свяжитесь с администратором через кнопку ниже',
    verifyStep2: '2️⃣ Предоставьте информацию о себе',
    verifyStep3: '3️⃣ Дождитесь подтверждения',
    verifyStep4: '4️⃣ После верификации вы получите уведомление',
    afterVerification: '✅ После верификации вы сможете использовать все функции системы.',
    goToSiteButton: '🌐 Перейти на сайт',
    contactAdmin: '💬 Связаться с администратором',
    verificationCodeTitle: '🔐 *Код подтверждения для входа*',
    verificationCodeGreeting: (name: string) => `👋 Привет, ${name}!`,
    verificationCodeMessage: (code: string) => `🔢 Ваш код: \`${code}\``,
    verificationCodeValid: '⏰ Код действителен 5 минут',
    verificationCodeAttempts: '🔄 Количество попыток: 5',
    verificationCodeEnter: '💻 Введите его на сайте для завершения входа',
    authError: '❌ Ошибка авторизации. Telegram ID не совпадает.',
    botBlocked: '🔒 Вы заблокировали бота BilimPoz Teacher.\n\n📋 *Как разблокировать бота:*\n\n1️⃣ Откройте приложение Telegram\n2️⃣ Найдите бота @{botUsername} в списке чатов\n3️⃣ Нажмите на бота и выберите "Разблокировать" или "Начать"\n4️⃣ Вернитесь на сайт и попробуйте войти снова',
    // Дополнительные сообщения из БД
    invalidParameters: '❌ Некорректные параметры',
    telegramAlreadyConnected: '❌ Этот Telegram уже подключен к другому логину',
    adminVerificationMessage: 'Здравствуйте! Я зарегистрировался в системе BilimPoz Teacher.\n\nИмя: {name}\nЛогин: {login}\n\nПрошу проверить и верифицировать мой аккаунт.'
  },
  kg: {
    welcome: '👋 BilimPoz Teacher\'ге кош келдиңиз!',
    unknownCommand: '❌ Белгисиз буйрук. Иштоону баштоо үчүн /start колдонуңуз.',
    userNotFound: '❌ Колдонуучу табылган жок. Шилтемени текшериңиз.',
    alreadyConnected: '✅ Сиздин Telegram аккаунтуңузга туташтырылган.',
    connectionSuccess: '✅ Telegram ийгиликтүү туташтырылды!',
    welcomeUser: (name: string) => `👋 Кош келдиңиз, ${name}!`,
    connectionSuccessVerified: '🎉 Сайтка кирип, иштоону баштай аласыз.',
    verificationRequired: '📋 *Аккаунтты ырастоо талап кылынат*',
    whatIsVerification: '❓ *Ырастоо деген эмне?*',
    verificationDescription: 'Ырастоо - бул администратор тарабынан сиздин жеке баңгиңизди ырастоо. Ырастоодон кийин сиз бардык функцияларга толук мүмкүнчүлүк аласыз.',
    howToVerify: '📝 *Ырастоону кантип өтүү керек?*',
    verifyStep1: '1️⃣ Төмөнкү баскыч аркылуу администратор менен байланышыңыз',
    verifyStep2: '2️⃣ Өзүңүз жөнүндө маалымат бериңиз',
    verifyStep3: '3️⃣ Ырастоону күтүңүз',
    verifyStep4: '4️⃣ Ырастоодон кийин сиз билдирүү аласыз',
    afterVerification: '✅ Ырастоодон кийин сиз системанын бардык функцияларын колдоно аласыз.',
    goToSiteButton: '🌐 Сайтка өтүү',
    contactAdmin: '💬 Администратор менен байланышуу',
    verificationCodeTitle: '🔐 *Кирүү үчүн ырастоо коду*',
    verificationCodeGreeting: (name: string) => `👋 Салам, ${name}!`,
    verificationCodeMessage: (code: string) => `🔢 Сиздин кодуңуз: \`${code}\``,
    verificationCodeValid: '⏰ Код 5 мүнөткө жарактуу',
    verificationCodeAttempts: '🔄 Аракеттер саны: 5',
    verificationCodeEnter: '💻 Кирүүнү аяктоо үчүн аны сайтка киргизиңиз',
    authError: '❌ Авторизация катасы. Telegram ID дал келбейт.',
    botBlocked: '🔒 Сиз BilimPoz Teacher ботуну бөгөттөдүңүз.\n\n📋 *Ботту кантип бөгөттөн чыгаруу:*\n\n1️⃣ Telegram колдонмосуну ачыңыз\n2️⃣ Чаттар тизмесинде @{botUsername} ботуну табыңыз\n3️⃣ Ботту басып, "Бөгөттөн чыгаруу" же "Баштоо" тандаңыз\n4️⃣ Сайтка кайтып, кайрадан кирүүгө аракет кылыңыз',
    // Дополнительные сообщения из БД
    invalidParameters: '❌ Туура эмес параметрлер',
    telegramAlreadyConnected: '❌ Бул Telegram башка логинге туташтырылган',
    adminVerificationMessage: 'Саламатсыздарбы! Мен BilimPoz Teacher системасына катталдым.\n\nАты: {name}\nЛогин: {login}\n\nАккаунтумду текшерип, ырастаңыз.'
  }
}

// Глобальная блокировка для предотвращения множественных polling
let globalPollingLock = false

class TelegramPollingService {
  private pollingActive = false
  private pollingTimeout: NodeJS.Timeout | null = null
  private offset = 0
  private botToken: string | null = null
  private static instance: TelegramPollingService | null = null
  private startPromise: Promise<boolean> | null = null

  // Singleton pattern для предотвращения множественных экземпляров
  static getInstance(): TelegramPollingService {
    if (!TelegramPollingService.instance) {
      TelegramPollingService.instance = new TelegramPollingService()
    }
    return TelegramPollingService.instance
  }

  // Геттер для проверки статуса
  get isActive() {
    return this.pollingActive && globalPollingLock
  }

  /**
   * Получение сообщений верификации из БД (прямая связь без кэширования)
   */
  private async getMessages(language: 'ru' | 'kg' = 'ru'): Promise<typeof defaultMessages.ru> {
    // Всегда загружаем из БД для прямой связи
    const dbMessages = await getVerificationMessages()
    
    // Базовые сообщения из дефолтных (включая функции)
    const baseMessages = { ...defaultMessages[language] }
    
    // Перезаписываем сообщения верификации из БД (если есть)
    if (dbMessages && dbMessages[language]) {
      const keys = Object.keys(dbMessages[language])
      
      keys.forEach(key => {
        if (key in baseMessages && typeof baseMessages[key as keyof typeof baseMessages] === 'string') {
          ;(baseMessages as any)[key] = dbMessages[language][key]
        }
      })
    }
    
    return baseMessages
  }

  /**
   * Запуск polling
   */
  async start(): Promise<boolean> {
    // Предотвращение множественных запусков
    if (this.startPromise) {
      console.log('⚠️ Polling уже запускается, ожидаем завершения...')
      return await this.startPromise
    }

    if (this.pollingActive) {
      console.log('⚠️ Polling уже активен')
      return true
    }

    // Создаем промис для предотвращения параллельных запусков
    this.startPromise = this._startInternal()
    
    try {
      const result = await this.startPromise
      return result
    } finally {
      this.startPromise = null
    }
  }

  private async _startInternal(): Promise<boolean> {
    try {
      // 0. Проверка глобальной блокировки
      if (globalPollingLock) {
        console.log('⚠️ Глобальная блокировка активна - другой экземпляр уже использует polling')
        return false
      }

      // 1. Загрузка токена из БД
      this.botToken = await getTeacherBotToken()
      
      if (!this.botToken) {
        console.error('❌ TEACHER_BOT_TOKEN не установлен')
        return false
      }

      // 2. Проверка бота
      const botCheck = await this.checkBot()
      if (!botCheck) {
        return false
      }

      // 3. Проверка на активный polling/webhook перед запуском
      const conflictCheck = await this.checkForConflicts()
      if (conflictCheck.hasConflict) {
        console.log('⚠️ Обнаружен конфликт, пытаемся очистить...')
        await this.forceClearConflicts()
        // Дополнительная задержка после очистки
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // 4. Удаление webhook перед запуском polling
      await this.deleteWebhook()
      
      // 5. Дополнительная задержка для очистки конфликтов
      console.log('⏳ Ожидание 2 секунды для очистки конфликтов...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 6. Установка глобальной блокировки
      globalPollingLock = true
      
      // 7. Запуск polling
      this.pollingActive = true
      console.log('🚀 Telegram polling запущен для бота:', botCheck.username)
      
      this.poll()
      return true
    } catch (error) {
      console.error('❌ Ошибка запуска polling:', error)
      this.pollingActive = false
      globalPollingLock = false
      return false
    }
  }

  /**
   * Остановка polling
   */
  stop() {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout)
      this.pollingTimeout = null
    }
    this.pollingActive = false
    globalPollingLock = false
    console.log('⏹️ Telegram polling остановлен')
  }

  /**
   * Проверка бота
   */
  private async checkBot() {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const result = await response.json()
      
      if (result.ok) {
        console.log('✅ Бот найден:', result.result.username, `(ID: ${result.result.id})`)
        return result.result
      } else {
        console.error('❌ Ошибка проверки бота:', result.description)
        return null
      }
    } catch (error) {
      console.error('❌ Ошибка подключения к Telegram API:', error)
      return null
    }
  }

  /**
   * Проверка на конфликты (активный webhook или другой polling)
   */
  private async checkForConflicts(): Promise<{ hasConflict: boolean; reason?: string }> {
    try {
      // Проверяем webhook
      const infoResponse = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`)
      const infoResult = await infoResponse.json()
      
      if (infoResult.ok && infoResult.result.url) {
        return { hasConflict: true, reason: `Активный webhook: ${infoResult.result.url}` }
      }

      // Пробуем сделать тестовый getUpdates для проверки конфликта
      try {
        const testResponse = await fetch(
          `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=-1&timeout=1&limit=1`
        )
        const testResult = await testResponse.json()
        
        if (!testResult.ok && testResult.description?.toLowerCase().includes('conflict')) {
          return { hasConflict: true, reason: 'Другой процесс использует getUpdates' }
        }
      } catch (error) {
        // Игнорируем ошибки тестового запроса
      }

      return { hasConflict: false }
    } catch (error) {
      console.warn('⚠️ Ошибка проверки конфликтов:', error)
      return { hasConflict: false }
    }
  }

  /**
   * Принудительная очистка конфликтов
   */
  private async forceClearConflicts() {
    try {
      console.log('🔄 Принудительная очистка конфликтов...')
      
      // 1. Удаляем webhook с очисткой pending updates
      await this.deleteWebhook()
      
      // 2. Делаем несколько getUpdates для очистки очереди
      let offset = 0
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        try {
          const updatesResponse = await fetch(
            `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=1&limit=100`
          )
          const updatesResult = await updatesResponse.json()
          
          if (updatesResult.ok && updatesResult.result.length > 0) {
            const lastUpdate = updatesResult.result[updatesResult.result.length - 1]
            offset = lastUpdate.update_id + 1
            console.log(`   └─ Очищено ${updatesResult.result.length} обновлений, новый offset: ${offset}`)
          } else if (updatesResult.ok) {
            console.log('   └─ Очередь обновлений пуста')
            break
          } else if (updatesResult.description?.toLowerCase().includes('conflict')) {
            console.log('   └─ ⚠️ Конфликт обнаружен, ждем...')
            await new Promise(resolve => setTimeout(resolve, 2000))
          } else {
            break
          }
          
          attempts++
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          console.warn('   └─ Ошибка при очистке:', error)
          attempts++
        }
      }

      console.log('✅ Очистка конфликтов завершена')
    } catch (error) {
      console.warn('⚠️ Ошибка принудительной очистки конфликтов:', error)
    }
  }

  /**
   * Удаление webhook
   */
  private async deleteWebhook() {
    try {
      // Сначала проверяем текущий webhook
      const infoResponse = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`)
      const infoResult = await infoResponse.json()
      
      if (infoResult.ok && infoResult.result.url) {
        console.log('🔗 Обнаружен webhook:', infoResult.result.url)
        console.log('📊 Pending updates:', infoResult.result.pending_update_count)
      }

      // Удаляем webhook с очисткой всех pending updates
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/deleteWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drop_pending_updates: true })
      })
      
      const result = await response.json()
      if (result.ok) {
        console.log('✅ Webhook удален и pending updates очищены')
      } else {
        console.warn('⚠️ Проблема при удалении webhook:', result.description)
      }
    } catch (error) {
      console.error('⚠️ Ошибка удаления webhook:', error)
    }
  }

  /**
   * Polling механизм
   */
  private async poll() {
    if (!this.pollingActive) return

    try {
      // Запрос обновлений с long polling (timeout 10 секунд)
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.offset}&timeout=10`
      )
      
      const data = await response.json()

      if (!data.ok) {
        console.error('❌ Telegram API error:', data.description)
        
        // Если ошибка конфликта - пытаемся очистить и перезапустить
        if (data.description && data.description.toLowerCase().includes('conflict')) {
          console.log('⚠️ Обнаружен конфликт getUpdates. Пытаемся очистить...')
          
          // Останавливаем текущий polling
          this.pollingActive = false
          globalPollingLock = false
          
          // Очищаем конфликты
          await this.forceClearConflicts()
          
          // Ждем перед перезапуском
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // Пытаемся перезапустить
          console.log('🔄 Попытка перезапуска polling после очистки конфликтов...')
          const restartResult = await this.start()
          
          if (!restartResult) {
            console.error('❌ Не удалось перезапустить polling после конфликта')
            console.log('💡 Убедитесь, что запущен только один экземпляр приложения')
          }
          return
        }
        
        // Планируем следующий запрос через 3 секунды для других ошибок
        if (this.pollingActive) {
          this.pollingTimeout = setTimeout(() => this.poll(), 3000)
        }
        return
      }

      // Обработка полученных обновлений
      if (data.result && data.result.length > 0) {
        console.log(`📨 Получено ${data.result.length} обновлений`)
        
        for (const update of data.result) {
          await this.processUpdate(update)
          // Увеличиваем offset для следующего запроса
          this.offset = update.update_id + 1
        }
      }
    } catch (error) {
      console.error('⚠️ Polling error:', error)
    }

    // Планируем следующий запрос через 3 секунды
    if (this.pollingActive) {
      this.pollingTimeout = setTimeout(() => this.poll(), 3000)
    }
  }

  /**
   * Обработка обновления
   */
  private async processUpdate(update: any) {
    // Проверка наличия сообщения и отправителя
    if (!update.message || !update.message.from) {
      return
    }

    const message = update.message
    const user = message.from
    const text = message.text

    if (!text) {
      return
    }

    console.log(`📩 Сообщение от ${user.first_name}: "${text}"`)

    // Проверка команды /start
    if (!text.startsWith('/start')) {
      // Отправляем справку для других команд
      const msg = await this.getMessages('ru')
      await this.sendMessage(user.id, msg.unknownCommand)
      return
    }

    // Обработка /start без параметров
    if (text.trim() === '/start') {
      await this.sendWelcomeMessage(user.id, 'ru')
      return
    }

    // Парсинг параметров /start
    // Формат: /start register_loginname__ru
    // или: /start login_loginname__kg
    const params = text.replace('/start ', '').trim()
    
    // Парсинг языка и параметров
    let language: 'ru' | 'kg' = 'ru'
    let paramsWithoutLanguage = params
    
    // Проверяем формат с двойным подчеркиванием (новый формат)
    const doubleSeparatorIndex = params.lastIndexOf('__')
    if (doubleSeparatorIndex !== -1) {
      const potentialLanguage = params.substring(doubleSeparatorIndex + 2)
      if (potentialLanguage === 'kg' || potentialLanguage === 'ky' || potentialLanguage === 'ru') {
        language = (potentialLanguage === 'ky' ? 'kg' : potentialLanguage) as 'ru' | 'kg'
        paramsWithoutLanguage = params.substring(0, doubleSeparatorIndex)
      }
    }

    // Парсинг mode и login
    const firstUnderscoreIndex = paramsWithoutLanguage.indexOf('_')
    if (firstUnderscoreIndex === -1) {
      const msg = await this.getMessages(language)
      await this.sendMessage(user.id, msg.invalidParameters)
      return
    }

    const mode = paramsWithoutLanguage.substring(0, firstUnderscoreIndex)
    const login = paramsWithoutLanguage.substring(firstUnderscoreIndex + 1)

    if (!mode || !login || !['register', 'login'].includes(mode)) {
      const msg = await this.getMessages(language)
      await this.sendMessage(user.id, msg.invalidParameters)
      return
    }

    // Поиск пользователя в БД
    const dbUser = await prisma.users.findUnique({
      where: { login },
      include: {
        social_networks: true
      }
    })

    if (!dbUser) {
      const msg = await this.getMessages(language)
      await this.sendMessage(user.id, msg.userNotFound)
      return
    }

    // Определяем язык пользователя из БД (приоритет над языком из URL)
    const userLanguage: 'ru' | 'kg' = dbUser.language === 'kg' ? 'kg' : 'ru'

    // Обработка в зависимости от режима
    if (mode === 'register') {
      await this.handleRegister(user, dbUser, userLanguage)
    } else if (mode === 'login') {
      await this.handleLogin(user, dbUser, userLanguage)
    }
  }

  /**
   * Отправка приветственного сообщения
   */
  private async sendWelcomeMessage(chatId: number, language: 'ru' | 'kg' = 'ru') {
    const msg = await this.getMessages(language)
    const welcomeText = `${msg.welcome}\n\n` +
      `Для регистрации или входа используйте ссылку с сайта BilimPoz Teacher.`
    
    await this.sendMessage(chatId, welcomeText)
  }

  /**
   * Обработка регистрации
   */
  private async handleRegister(user: any, dbUser: any, userLanguage: 'ru' | 'kg' = 'ru') {
    const telegramIdString = user.id.toString()
    const msg = await this.getMessages(userLanguage)
    
    // 1. Проверка: уже подключен ли этот Telegram к пользователю
    if (dbUser.telegram_id === telegramIdString) {
      // Обновление username и фото профиля (с учетом S3)
      await this.updateUserTelegramData(user, dbUser)
      await this.sendMessage(user.id, msg.alreadyConnected)
      return
    }
    
    // 2. Проверка: используется ли telegram_id другим пользователем
    const existingTelegramUser = await prisma.users.findUnique({
      where: { telegram_id: telegramIdString }
    })
    
    if (existingTelegramUser && existingTelegramUser.id !== dbUser.id) {
      await this.sendMessage(user.id, msg.telegramAlreadyConnected)
      return
    }
    
    // 3. Проверяем, есть ли у пользователя фото из S3
    const currentPhotoUrl = dbUser.profile_photo_url
    const isPhotoFromS3 = isS3Url(currentPhotoUrl)
    
    // 4. Получение фото профиля из Telegram (только если нет фото из S3)
    let profilePhotoUrl: string | null = currentPhotoUrl
    
    if (!isPhotoFromS3) {
      // Если нет фото из S3, получаем из Telegram
      profilePhotoUrl = await this.getTelegramProfilePhoto(user.id)
      console.log(`📷 Получено фото из Telegram для ${dbUser.login}`)
    } else {
      console.log(`📷 У пользователя ${dbUser.login} есть фото из S3 - сохраняем его`)
    }
    
    // 5. Обновление данных пользователя в БД
    await prisma.users.update({
      where: { id: dbUser.id },
      data: {
        telegram_id: telegramIdString,
        profile_photo_url: profilePhotoUrl,
        updated_at: new Date()
      }
    })
    
    // 7. Обновление социальных сетей
    await prisma.social_networks.upsert({
      where: { user_id: dbUser.id },
      update: { telegram_login: user.username || null },
      create: {
        user_id: dbUser.id,
        telegram_login: user.username || null
      }
    })
    
    // 8. Отправка приветственного сообщения
    const isVerified = dbUser.status === 'verified'
    const siteUrl = await getTeacherSiteUrl()
    
    if (isVerified) {
      // Для верифицированных пользователей - короткое сообщение
      await this.sendMessage(user.id, 
        `${msg.connectionSuccess}\n\n` +
        `${msg.welcomeUser(dbUser.name)}\n\n` +
        `${msg.connectionSuccessVerified}`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: msg.goToSiteButton, url: siteUrl }]]
          }
        }
      )
    } else {
      // Для не верифицированных - инструкция по верификации
      const verificationMessage = msg.adminVerificationMessage
        .replace('{name}', dbUser.name)
        .replace('{login}', dbUser.login)
      
      const adminButton = await this.getAdminButton(verificationMessage, userLanguage)
      
      const keyboard: any[] = []
      if (adminButton) {
        keyboard.push([adminButton])
      }
      keyboard.push([{ text: msg.goToSiteButton, url: siteUrl }])
      
      await this.sendMessage(user.id,
        `${msg.connectionSuccess}\n\n` +
        `${msg.welcomeUser(dbUser.name)}\n\n` +
        `${msg.verificationRequired}\n\n` +
        `${msg.whatIsVerification}\n` +
        `${msg.verificationDescription}\n\n` +
        `${msg.howToVerify}\n` +
        `${msg.verifyStep1}\n` +
        `${msg.verifyStep2}\n` +
        `${msg.verifyStep3}\n` +
        `${msg.verifyStep4}\n\n` +
        `${msg.afterVerification}`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: keyboard
          }
        }
      )
    }
    
    console.log(`✅ Telegram подключен для пользователя ${dbUser.name} (${dbUser.login})`)
  }

  /**
   * Обработка входа
   */
  private async handleLogin(user: any, dbUser: any, userLanguage: 'ru' | 'kg' = 'ru') {
    const msg = await this.getMessages(userLanguage)
    
    // 1. Проверка: если у пользователя нет Telegram ID, устанавливаем его
    if (!dbUser.telegram_id) {
      await this.handleRegister(user, dbUser, userLanguage)
      return
    }
    
    // 2. Проверка: Telegram ID должен совпадать
    if (dbUser.telegram_id !== user.id.toString()) {
      await this.sendMessage(user.id, msg.authError)
      return
    }
    
    // 3. Обновление username и фото профиля при каждом входе
    await this.updateUserTelegramData(user, dbUser)
    
    // 4. Генерация кода верификации
    const verificationCode = await generateAndStoreVerificationCode(dbUser.id, 'login')
    
    // 5. Отправка кода пользователю
    const sendResult = await this.sendMessage(
      user.id,
      `${msg.verificationCodeTitle}\n\n` +
      `${msg.verificationCodeGreeting(dbUser.name)}\n\n` +
      `${msg.verificationCodeMessage(verificationCode)}\n\n` +
      `${msg.verificationCodeValid}\n` +
      `${msg.verificationCodeAttempts}\n` +
      `${msg.verificationCodeEnter}`,
      { parse_mode: 'Markdown' }
    )
    
    // 6. Обработка ошибки блокировки бота
    if (!sendResult.success && sendResult.isBlocked) {
      const botUsername = await getTeacherBotUsername()
      await this.sendMessage(user.id,
        msg.botBlocked.replace('{botUsername}', botUsername || 'BilimpozTeachersbot'),
        { parse_mode: 'Markdown' }
      )
      return
    }
  }

  /**
   * Получение информации о пользователе из Telegram (Chat)
   */
  private async getTelegramUserInfo(userId: number): Promise<{ username?: string } | null> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getChat?chat_id=${userId}`
      )
      const data = await response.json()
      
      if (data.ok && data.result) {
        return {
          username: data.result.username || null
        }
      }
      
      return null
    } catch (error) {
      console.log('⚠️ Не удалось получить информацию о пользователе:', error)
      return null
    }
  }

  /**
   * Получение фото профиля из Telegram
   */
  private async getTelegramProfilePhoto(userId: number): Promise<string | null> {
    try {
      // 1. Запрос списка фото
      const photosResponse = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`
      )
      const photosData = await photosResponse.json()
      
      if (!photosData.ok || photosData.result.total_count === 0) {
        return null
      }
      
      // 2. Выбор фото с максимальным разрешением
      const photoSizes = photosData.result.photos[0]
      let largestPhoto = photoSizes[0]
      let maxSize = (largestPhoto.width || 0) * (largestPhoto.height || 0)
      
      for (const photo of photoSizes) {
        const size = (photo.width || 0) * (photo.height || 0)
        if (size > maxSize) {
          maxSize = size
          largestPhoto = photo
        }
      }
      
      // 3. Получение URL файла
      const fileId = largestPhoto.file_id
      const fileResponse = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`
      )
      const fileData = await fileResponse.json()
      
      if (fileData.ok) {
        return `https://api.telegram.org/file/bot${this.botToken}/${fileData.result.file_path}`
      }
      
      return null
    } catch (error) {
      console.log('⚠️ Не удалось получить фото профиля:', error)
      return null
    }
  }

  /**
   * Обновление фото профиля
   */
  private async updateProfilePhoto(user: any, dbUser: any) {
    try {
      const profilePhotoUrl = await this.getTelegramProfilePhoto(user.id)
      if (profilePhotoUrl && profilePhotoUrl !== dbUser.profile_photo_url) {
        // Удаление старого фото
        if (dbUser.profile_photo_url) {
          await this.deleteOldPhotoFromS3(dbUser.profile_photo_url)
        }
        
        // Обновление в БД
        await prisma.users.update({
          where: { id: dbUser.id },
          data: {
            profile_photo_url: profilePhotoUrl,
            updated_at: new Date()
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ Не удалось обновить фото профиля:', error)
    }
  }

  /**
   * Обновление данных Telegram пользователя (username и фото)
   * Фото профиля обновляется только если текущее фото из Telegram (не из S3)
   */
  private async updateUserTelegramData(user: any, dbUser: any) {
    try {
      console.log(`🔄 Обновление данных Telegram для пользователя ${dbUser.login}...`)
      
      // 1. Проверяем, нужно ли обновлять фото
      // Если фото загружено в S3 (через настройки профиля), НЕ обновляем его
      const currentPhotoUrl = dbUser.profile_photo_url
      const isPhotoFromS3 = isS3Url(currentPhotoUrl)
      const isPhotoFromTelegram = isTelegramUrl(currentPhotoUrl)
      
      // 2. Получаем актуальный username из Telegram
      const telegramUsername = user.username || null
      
      // 3. Получаем актуальное фото профиля только если текущее фото из Telegram или отсутствует
      let profilePhotoUrl: string | null = null
      let shouldUpdatePhoto = false
      
      if (!currentPhotoUrl || isPhotoFromTelegram) {
        // Фото отсутствует или из Telegram - можно обновлять
        profilePhotoUrl = await this.getTelegramProfilePhoto(user.id)
        shouldUpdatePhoto = profilePhotoUrl !== null && profilePhotoUrl !== currentPhotoUrl
        
        if (isPhotoFromS3) {
          console.log(`📷 Фото профиля для ${dbUser.login} загружено из S3 - пропускаем обновление фото`)
        }
      } else if (isPhotoFromS3) {
        console.log(`📷 Фото профиля для ${dbUser.login} загружено из S3 - пропускаем обновление фото`)
      }
      
      // 4. Проверяем, нужно ли обновлять username
      const shouldUpdateUsername = telegramUsername !== dbUser.social_networks?.telegram_login
      
      if (!shouldUpdatePhoto && !shouldUpdateUsername) {
        console.log(`✅ Данные Telegram для ${dbUser.login} актуальны`)
        return
      }
      
      // 5. Обновление фото в БД (только если нужно и фото не из S3)
      if (shouldUpdatePhoto && profilePhotoUrl) {
        await prisma.users.update({
          where: { id: dbUser.id },
          data: {
            profile_photo_url: profilePhotoUrl,
            updated_at: new Date()
          }
        })
        console.log(`✅ Фото профиля обновлено для ${dbUser.login}`)
      }
      
      // 6. Обновление username в social_networks
      if (shouldUpdateUsername) {
        await prisma.social_networks.upsert({
          where: { user_id: dbUser.id },
          create: {
            user_id: dbUser.id,
            telegram_login: telegramUsername
          },
          update: {
            telegram_login: telegramUsername
          }
        })
        console.log(`✅ Username обновлен для ${dbUser.login}: ${telegramUsername || 'нет'}`)
      }
      
      console.log(`✅ Данные Telegram успешно обновлены для ${dbUser.login}`)
    } catch (error) {
      console.warn(`⚠️ Не удалось обновить данные Telegram для ${dbUser.login}:`, error)
    }
  }

  /**
   * Удаление старого фото из S3
   */
  private async deleteOldPhotoFromS3(photoUrl: string): Promise<void> {
    try {
      // Проверяем, что это S3 URL
      if (photoUrl.includes('s3') || 
          photoUrl.includes('amazonaws.com') ||
          photoUrl.includes('storage.yandexcloud.net')) {
        // Если есть функции S3, используем их
        // const { deleteFileFromS3 } = await import('@/lib/s3')
        // await deleteFileFromS3(photoUrl)
        console.log(`🗑️ Старое фото профиля будет удалено: ${photoUrl}`)
      }
    } catch (error) {
      console.warn('⚠️ Не удалось удалить старое фото из S3:', error)
    }
  }

  /**
   * Получение кнопки администратора
   */
  private async getAdminButton(
    verificationMessage: string, 
    language: 'ru' | 'kg' = 'ru'
  ): Promise<{ text: string; url: string } | null> {
    try {
      const adminTelegram = await getAdminTelegramLogin()
      
      if (!adminTelegram) {
        return null
      }
      
      // Формирование URL
      let adminChatUrl = adminTelegram
      if (adminChatUrl.startsWith('@')) {
        adminChatUrl = `https://t.me/${adminChatUrl.substring(1)}`
      } else if (!adminChatUrl.startsWith('http')) {
        adminChatUrl = `https://t.me/${adminChatUrl}`
      }
      
      // Добавление предзаполненного текста
      const encodedMessage = encodeURIComponent(verificationMessage)
      const msg = await this.getMessages(language)
      return {
        text: msg.contactAdmin,
        url: `${adminChatUrl}?text=${encodedMessage}`
      }
    } catch (error) {
      console.warn('⚠️ Не удалось создать кнопку администратора:', error)
      return null
    }
  }

  /**
   * Отправка сообщения
   */
  private async sendMessage(
    chatId: number, 
    text: string, 
    options: any = {}
  ): Promise<{ success: boolean; error?: string; isBlocked?: boolean }> {
    try {
      // 1. Загрузка токена
      if (!this.botToken) {
        this.botToken = await getTeacherBotToken()
      }
      
      if (!this.botToken) {
        return { success: false, error: 'Bot token не настроен' }
      }
      
      // 2. Проверка формата токена
      if (this.botToken.length < 10) {
        return { success: false, error: 'Bot token имеет неправильный формат' }
      }
      
      // 3. Отправка сообщения
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            ...options
          })
        }
      )

      const result = await response.json()

      if (result.ok) {
        return { success: true }
      }

      // 4. Обработка ошибок
      const errorDescription = result.description || ''
      const errorCode = result.error_code
      
      // Ошибка 404 - бот не найден
      if (errorCode === 404) {
        return { 
          success: false, 
          error: 'Бот не найден. Проверьте настройки токена в БД.' 
        }
      }
      
      // Ошибка 403 - бот заблокирован
      if (errorCode === 403 || 
          errorDescription.toLowerCase().includes('blocked') || 
          errorDescription.toLowerCase().includes('chat not found')) {
        return { 
          success: false, 
          error: errorDescription,
          isBlocked: true 
        }
      }

      return { success: false, error: errorDescription || `Ошибка ${errorCode}` }
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error)
      return { success: false, error: 'Ошибка сети' }
    }
  }

  /**
   * Публичный метод для отправки кода верификации (используется в API)
   */
  async sendVerificationCode(
    login: string, 
    telegramId: string, 
    language?: string
  ): Promise<{ success: boolean; isBlocked?: boolean; error?: string }> {
    try {
      // 0. Убедиться, что токен загружен
      if (!this.botToken) {
        this.botToken = await getTeacherBotToken()
      }
      
      if (!this.botToken) {
        console.error('[sendVerificationCode] Bot token not found')
        return { success: false, error: 'Bot token не настроен' }
      }

      // 1. Поиск пользователя в БД
      const dbUser = await prisma.users.findUnique({
        where: { login },
        include: {
          social_networks: true
        }
      })

      if (!dbUser) {
        return { success: false, error: 'Пользователь не найден' }
      }

      // 2. Проверка Telegram ID
      if (dbUser.telegram_id !== telegramId) {
        return { success: false, error: 'Telegram ID не совпадает' }
      }

      // 2.5. Обновление username и фото профиля при каждом входе
      const telegramUserId = parseInt(telegramId)
      const telegramUserInfo = await this.getTelegramUserInfo(telegramUserId)
      const telegramUser = {
        id: telegramUserId,
        username: telegramUserInfo?.username || null
      }
      await this.updateUserTelegramData(telegramUser, dbUser)

      // 3. Определение языка
      const userLanguage: 'ru' | 'kg' = (language === 'ky' || language === 'kg') ? 'kg' : 'ru'
      const msg = await this.getMessages(userLanguage)

      // 4. Генерация кода верификации
      const verificationCode = await generateAndStoreVerificationCode(dbUser.id, 'login')
      console.log(`[sendVerificationCode] Generated code for user ${dbUser.login}, sending to Telegram ${telegramId}`)

      // 5. Отправка кода в Telegram
      const sendResult = await this.sendMessage(
        parseInt(telegramId),
        `${msg.verificationCodeTitle}\n\n` +
        `${msg.verificationCodeGreeting(dbUser.name)}\n\n` +
        `${msg.verificationCodeMessage(verificationCode)}\n\n` +
        `${msg.verificationCodeValid}\n` +
        `${msg.verificationCodeAttempts}\n` +
        `${msg.verificationCodeEnter}`,
        { parse_mode: 'Markdown' }
      )

      console.log(`[sendVerificationCode] Send result:`, sendResult)

      // 6. Обработка ошибки блокировки
      if (!sendResult.success && sendResult.isBlocked) {
        return { success: false, isBlocked: true, error: 'Бот заблокирован пользователем' }
      }

      return { success: sendResult.success, error: sendResult.error }
    } catch (error) {
      console.error('❌ Ошибка отправки кода верификации:', error)
      return { success: false, error: 'Ошибка отправки кода' }
    }
  }

  /**
   * Отправка кода восстановления пароля (используется в API)
   */
  async sendRecoveryCode(
    telegramId: string,
    code: string,
    login: string
  ): Promise<{ success: boolean; isBlocked?: boolean; error?: string }> {
    try {
      const user = await prisma.users.findUnique({
        where: { login }
      })
      
      if (!user) {
        return { success: false, error: 'Пользователь не найден' }
      }
      
      const message = `🔑 *Код восстановления пароля*

Здравствуйте, ${user.name}!

Ваш код восстановления: \`${code}\`

Введите этот код для сброса пароля.

⏰ Код действителен в течение 5 минут.`

      const sendResult = await this.sendMessage(
        parseInt(telegramId),
        message,
        { parse_mode: 'Markdown' }
      )

      if (!sendResult.success && sendResult.isBlocked) {
        return { success: false, isBlocked: true, error: 'BOT_BLOCKED' }
      }

      return { success: sendResult.success, error: sendResult.error }
    } catch (error) {
      console.error('Error sending recovery code:', error)
      return { success: false, error: 'Network error' }
    }
  }
}

// Экспорт singleton экземпляра
export const telegramPolling = TelegramPollingService.getInstance()

// Graceful shutdown при завершении процесса
if (typeof process !== 'undefined') {
  const gracefulShutdown = () => {
    console.log('🔄 Graceful shutdown: останавливаем Telegram polling...')
    telegramPolling.stop()
    process.exit(0)
  }

  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
  process.on('beforeExit', () => {
    telegramPolling.stop()
  })
}

