# Документация: Система аутентификации

## Обзор

Данный документ описывает полную систему аутентификации приложения Bilimpoz Admin, включая:
- Процесс входа в систему
- Работу с паролями и хешированием
- Генерацию и валидацию JWT токенов
- Работу с cookies
- Двухфакторную аутентификацию через Telegram
- Хранение и проверку кодов подтверждения
- Безопасность и защиту данных

---

## 1. Архитектура системы аутентификации

### 1.1 Компоненты системы

```
┌─────────────────┐
│   Клиент (UI)   │
│  LoginForm.tsx  │
│ TelegramForm.tsx│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │
│  /api/auth/*    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Core Libraries │
│  auth.ts        │
│  verification.ts│
│  telegram.ts    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│   PostgreSQL    │
│   (Prisma ORM)  │
└─────────────────┘
```

### 1.2 Основные файлы

| Файл | Назначение |
|------|------------|
| `src/lib/auth.ts` | Основные функции аутентификации (хеширование, JWT) |
| `src/lib/verification.ts` | Генерация и проверка кодов подтверждения |
| `src/lib/telegram.ts` | Интеграция с Telegram API |
| `src/lib/client-auth.ts` | Клиентские утилиты для работы с токенами |
| `src/app/api/auth/login/route.ts` | API роут для входа |
| `src/app/api/auth/verify-code/route.ts` | API роут для проверки кода |
| `src/app/api/auth/resend-code/route.ts` | API роут для повторной отправки кода |
| `src/app/api/auth/logout/route.ts` | API роут для выхода |
| `src/contexts/AuthContext.tsx` | React контекст для управления состоянием аутентификации |

---

## 2. Процесс входа в систему

### 2.1 API Endpoint: `/api/auth/login`

**Расположение:** `src/app/api/auth/login/route.ts`

**Метод:** `POST`

**Тело запроса:**
```json
{
  "login": "string",
  "password": "string"
}
```

**Процесс выполнения:**

#### Шаг 1: Валидация входных данных
```typescript
if (!login || !password) {
  return NextResponse.json(
    { error: 'Логин и пароль обязательны' },
    { status: 400 }
  )
}
```

#### Шаг 2: Поиск пользователя в базе данных
```typescript
const user = await prisma.users.findUnique({
  where: { login: login },
  select: {
    id: true,
    name: true,
    login: true,
    hash_password: true,
    role: true,
    status: true,
    telegram_id: true
  }
})
```

**Источник данных:**
- **Таблица:** `users` (PostgreSQL)
- **Поле для поиска:** `login` (уникальное поле)
- **Возвращаемые поля:** Исключается `hash_password` из финального ответа

#### Шаг 3: Проверка существования пользователя
```typescript
if (!user) {
  return NextResponse.json(
    { error: 'Неверный логин или пароль' },
    { status: 401 }
  )
}
```

**Безопасность:** Сообщение об ошибке не раскрывает, существует ли пользователь (защита от перебора).

#### Шаг 4: Проверка статуса пользователя
```typescript
if (user.status === 'banned' || user.status === 'deleted') {
  return NextResponse.json(
    { error: 'Аккаунт заблокирован или удален' },
    { status: 403 }
  )
}
```

**Возможные статусы:**
- `registered` - зарегистрирован
- `verified` - верифицирован
- `banned` - заблокирован
- `deleted` - удален

#### Шаг 5: Проверка пароля
```typescript
const isPasswordValid = await verifyPassword(password, user.hash_password)

if (!isPasswordValid) {
  return NextResponse.json(
    { error: 'Неверный логин или пароль' },
    { status: 401 }
  )
}
```

**Функция `verifyPassword`:**
- **Расположение:** `src/lib/auth.ts`
- **Алгоритм:** `bcrypt.compare()`
- **Безопасность:** Использует константное время сравнения (защита от timing attacks)

#### Шаг 6: Генерация JWT токена
```typescript
const token = generateToken({
  userId: user.id,
  login: user.login,
  role: user.role
})
```

**Параметры токена:**
- `userId` - уникальный идентификатор пользователя
- `login` - логин пользователя
- `role` - роль пользователя (`admin`, `teacher`, `student`)
- `exp` - срок действия (7 дней)
- `iat` - время создания

#### Шаг 7: Проверка наличия Telegram ID

**Вариант A: У пользователя нет Telegram ID**
```typescript
if (!user.telegram_id) {
  const response = NextResponse.json({
    success: true,
    user: userWithoutPassword,
    token: token,
    message: 'Авторизация успешна',
    requiresTelegramVerification: true
  })
  
  // Устанавливаем токен в cookies
  response.cookies.set('auth-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 дней
    path: '/'
  })
  
  return response
}
```

**Вариант B: У пользователя есть Telegram ID (двухфакторная аутентификация)**

```typescript
// Генерируем и сохраняем код подтверждения
const verificationCode = generateVerificationCode()
await storeVerificationCode(user.id, verificationCode)

// Отправляем код в Telegram
const messageSent = await telegramService.sendVerificationCode(
  user.telegram_id, 
  verificationCode
)

if (!messageSent) {
  return NextResponse.json({
    error: 'Ошибка отправки кода в Telegram'
  }, { status: 500 })
}

const response = NextResponse.json({
  success: true,
  user: userWithoutPassword,
  token: token,
  message: 'Код подтверждения отправлен в Telegram',
  requiresVerification: true
})

// Устанавливаем токен в cookies
response.cookies.set('auth-token', token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/'
})

return response
```

**Ответ API:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "string",
    "login": "string",
    "role": "admin|teacher|student",
    "status": "registered|verified|banned|deleted",
    "telegram_id": "string|null"
  },
  "token": "jwt_token_string",
  "message": "Код подтверждения отправлен в Telegram",
  "requiresVerification": true
}
```

---

## 3. Работа с паролями

### 3.1 Хеширование паролей

**Функция:** `hashPassword(password: string): Promise<string>`

**Расположение:** `src/lib/auth.ts`

**Реализация:**
```typescript
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}
```

**Параметры:**
- **Алгоритм:** bcrypt
- **Salt rounds:** 12 (рекомендуемое значение для баланса безопасности и производительности)
- **Время хеширования:** ~300-500ms (защита от brute-force)

**Использование:**
- При создании нового пользователя
- При смене пароля

### 3.2 Проверка паролей

**Функция:** `verifyPassword(password: string, hashedPassword: string): Promise<boolean>`

**Расположение:** `src/lib/auth.ts`

**Реализация:**
```typescript
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}
```

**Безопасность:**
- Использует константное время сравнения
- Защита от timing attacks
- Автоматическое извлечение salt из хеша

**Использование:**
- При входе в систему (`/api/auth/login`)
- При смене пароля (проверка старого пароля)

---

## 4. JWT токены

### 4.1 Генерация токенов

**Функция:** `generateToken(payload: JWTPayload): string`

**Расположение:** `src/lib/auth.ts`

**Реализация:**
```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  userId: string
  login: string
  role: string
  iat?: number
  exp?: number
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}
```

**Параметры:**
- **Секретный ключ:** `JWT_SECRET` из переменных окружения
- **Срок действия:** 7 дней (`7d`)
- **Алгоритм:** HS256 (по умолчанию для `jwt.sign`)

**Структура токена:**
```
header.payload.signature
```

**Payload содержит:**
```json
{
  "userId": "uuid",
  "login": "string",
  "role": "admin|teacher|student",
  "iat": 1234567890,
  "exp": 1235173890
}
```

### 4.2 Валидация токенов

**Функция:** `verifyToken(token: string): JWTPayload | null`

**Расположение:** `src/lib/auth.ts`

**Реализация:**
```typescript
export function verifyToken(token: string): JWTPayload | null {
  try {
    // Проверка формата токена
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null
    }

    // Проверка структуры JWT (должен содержать 2 точки)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Верификация токена
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    return payload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('[verifyToken] ✗ Token EXPIRED')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('[verifyToken] ✗ Invalid token')
    }
    return null
  }
}
```

**Проверки:**
1. Формат токена (не пустой, строка)
2. Структура JWT (3 части, разделенные точками)
3. Подпись токена (проверка секретного ключа)
4. Срок действия (exp)
5. Формат payload

**Возвращаемое значение:**
- `JWTPayload` - если токен валиден
- `null` - если токен невалиден или истек

### 4.3 Аутентификация запросов

**Функция:** `auth(request: NextRequest)`

**Расположение:** `src/lib/auth.ts`

**Реализация:**
```typescript
export async function auth(request: NextRequest) {
  // Извлечение токена из заголовка Authorization
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7) // Убираем "Bearer "
  const payload = verifyToken(token)
  
  if (!payload) {
    return null
  }

  // Получение актуальных данных пользователя из БД
  try {
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        login: true,
        profile_photo_url: true,
        role: true,
        status: true,
        telegram_id: true
      }
    })
    
    if (!user) {
      return null
    }

    // Проверка статуса пользователя
    if (user.status === 'banned' || user.status === 'deleted') {
      return null
    }
    
    return user
  } catch (error) {
    // Обработка ошибок подключения к БД
    if (error instanceof PrismaClientInitializationError || 
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001')) {
      throw new Error('DATABASE_CONNECTION_ERROR')
    }
    throw error
  }
}
```

**Процесс:**
1. Извлечение токена из заголовка `Authorization: Bearer <token>`
2. Валидация токена через `verifyToken()`
3. Получение актуальных данных пользователя из БД
4. Проверка статуса пользователя
5. Возврат данных пользователя или `null`

**Обработка ошибок:**
- Ошибки подключения к БД пробрасываются как `DATABASE_CONNECTION_ERROR`
- Другие ошибки пробрасываются дальше

### 4.4 Хелпер для защищенных роутов

**Функция:** `authenticatedHandler(request, handler)`

**Расположение:** `src/lib/auth.ts`

**Реализация:**
```typescript
export async function authenticatedHandler(
  request: NextRequest,
  handler: (user: Awaited<ReturnType<typeof auth>>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await auth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    return await handler(user)
  } catch (error) {
    // Обработка ошибок подключения к БД
    if (error instanceof Error && error.message === 'DATABASE_CONNECTION_ERROR') {
      return NextResponse.json(
        { 
          error: 'Не удается подключиться к базе данных...',
          code: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
```

**Использование:**
```typescript
export async function GET(request: NextRequest) {
  return authenticatedHandler(request, async (user) => {
    // user гарантированно не null
    return NextResponse.json(user)
  })
}
```

---

## 5. Работа с Cookies

### 5.1 Установка токена в Cookies (сервер)

**Расположение:** API роуты (`/api/auth/login`, `/api/auth/verify-code`)

**Реализация:**
```typescript
response.cookies.set('auth-token', token, {
  httpOnly: false, // Нужно для доступа из JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS только в production
  sameSite: 'lax', // Защита от CSRF
  maxAge: 7 * 24 * 60 * 60, // 7 дней (в секундах)
  path: '/' // Доступно для всех путей
})
```

**Параметры:**
- **httpOnly:** `false` - позволяет JavaScript читать cookie (необходимо для клиентской аутентификации)
- **secure:** `true` в production - передача только по HTTPS
- **sameSite:** `lax` - защита от CSRF, но позволяет переходы по ссылкам
- **maxAge:** `604800` секунд (7 дней)
- **path:** `/` - доступно для всех путей приложения

**Безопасность:**
- В production используется HTTPS (`secure: true`)
- `sameSite: 'lax'` защищает от CSRF атак
- Срок действия ограничен 7 днями

### 5.2 Чтение токена из Cookies (клиент)

**Функция:** `getAuthToken(): string | null`

**Расположение:** `src/lib/client-auth.ts`

**Реализация:**
```typescript
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  
  // Получаем токен только из cookies (единственный источник правды)
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
  
  if (authCookie) {
    const token = authCookie.split('=')[1]
    return token
  }
  
  return null
}
```

**Особенности:**
- Работает только на клиенте (`typeof window !== 'undefined'`)
- Парсит `document.cookie` вручную
- Возвращает `null` если токен не найден

### 5.3 Установка токена в Cookies (клиент)

**Функция:** `setAuthToken(token: string): void`

**Расположение:** `src/lib/client-auth.ts`

**Реализация:**
```typescript
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  
  // Устанавливаем cookie с правильными параметрами (синхронизируем с сервером)
  const isSecure = window.location.protocol === 'https:'
  const maxAge = 7 * 24 * 60 * 60 // 7 дней
  
  const cookieString = `auth-token=${token}; path=/; max-age=${maxAge}; ${isSecure ? 'secure;' : ''} samesite=lax`
  document.cookie = cookieString
}
```

**Особенности:**
- Определяет протокол автоматически (`https:` → `secure`)
- Синхронизирует параметры с сервером
- Устанавливает `max-age` и `samesite`

### 5.4 Удаление токена из Cookies

**Функция:** `removeAuthToken(): void`

**Расположение:** `src/lib/client-auth.ts`

**Реализация:**
```typescript
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  
  // Удаляем cookie и кэш пользователя
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  localStorage.removeItem('user')
}
```

**Действия:**
1. Удаляет cookie (устанавливает дату истечения в прошлое)
2. Удаляет данные пользователя из `localStorage`

### 5.5 Получение заголовков для API запросов

**Функция:** `getAuthHeaders(): HeadersInit`

**Расположение:** `src/lib/client-auth.ts`

**Реализация:**
```typescript
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  
  if (!token) {
    return {
      'Content-Type': 'application/json',
    }
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}
```

**Использование:**
```typescript
const response = await fetch('/api/user/me', {
  headers: getAuthHeaders()
})
```

---

## 6. Система подтверждения кода (Telegram 2FA)

### 6.1 Генерация кода подтверждения

**Функция:** `generateVerificationCode(): string`

**Расположение:** `src/lib/verification.ts`

**Реализация:**
```typescript
export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  console.log('Generated verification code:', code)
  return code
}
```

**Характеристики:**
- **Длина:** 6 цифр
- **Диапазон:** 100000 - 999999
- **Формат:** Строка из 6 цифр
- **Безопасность:** Использует `Math.random()` (достаточно для одноразовых кодов)

**Пример:** `"123456"`, `"789012"`

### 6.2 Хранение кода подтверждения

**Функция:** `storeVerificationCode(userId: string, code: string): Promise<void>`

**Расположение:** `src/lib/verification.ts`

**Реализация:**
```typescript
// Временное хранилище в памяти (дублирование для надежности)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; userId: string; createdAt: Date }>()
const verificationCodesBackup = new Map<string, { code: string; expiresAt: Date; userId: string; createdAt: Date }>()

export async function storeVerificationCode(userId: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 минут
  const createdAt = new Date()
  const codeData = { code, expiresAt, userId, createdAt }
  
  // Сохраняем в основное хранилище и резервную копию
  verificationCodes.set(userId, codeData)
  verificationCodesBackup.set(userId, { ...codeData })
  
  // Также сохраняем в базу данных для персистентности
  try {
    // Удаляем старые коды для этого пользователя
    await prisma.settings.deleteMany({
      where: {
        key: {
          startsWith: `verification_code_${userId}_`
        }
      }
    })
    
    // Сохраняем новый код с временной меткой истечения
    const settingKey = `verification_code_${userId}_${Date.now()}`
    const settingValue = JSON.stringify({
      code,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString()
    })
    
    await prisma.settings.create({
      data: {
        key: settingKey,
        value: settingValue
      }
    })
  } catch (dbError) {
    console.error('Failed to save verification code to database:', dbError)
    // Продолжаем работу с памятью даже если БД недоступна
  }
  
  // Автоматическая очистка истекших кодов
  setTimeout(() => {
    verificationCodes.delete(userId)
    verificationCodesBackup.delete(userId)
  }, 5 * 60 * 1000)
}
```

**Хранение:**
1. **В памяти (основное хранилище):** `Map<userId, codeData>`
2. **В памяти (резервная копия):** `Map<userId, codeData>` (дублирование)
3. **В базе данных:** Таблица `settings` с ключом `verification_code_{userId}_{timestamp}`

**Структура данных:**
```typescript
{
  code: string,           // 6-значный код
  expiresAt: Date,        // Время истечения (5 минут)
  userId: string,         // ID пользователя
  createdAt: Date         // Время создания
}
```

**Срок действия:** 5 минут (300 секунд)

**Персистентность:**
- Коды сохраняются в БД для восстановления после перезапуска сервера
- При недоступности БД система продолжает работать с памятью

### 6.3 Проверка кода подтверждения

**Функция:** `verifyCode(userId: string, inputCode: string): Promise<boolean>`

**Расположение:** `src/lib/verification.ts`

**Реализация:**
```typescript
export async function verifyCode(userId: string, inputCode: string): Promise<boolean> {
  // 1. Поиск в основном хранилище
  let stored = verificationCodes.get(userId)
  
  // 2. Если не найдено, проверяем резервную копию
  if (!stored) {
    stored = verificationCodesBackup.get(userId)
    if (stored) {
      // Восстанавливаем в основное хранилище
      verificationCodes.set(userId, stored)
    }
  }
  
  // 3. Если не найдено в памяти, проверяем базу данных
  if (!stored) {
    const dbCodes = await prisma.settings.findMany({
      where: {
        key: { startsWith: `verification_code_${userId}_` }
      },
      orderBy: { created_at: 'desc' },
      take: 1
    })
    
    if (dbCodes.length > 0) {
      const dbCode = dbCodes[0]
      const codeData = JSON.parse(dbCode.value)
      const expiresAt = new Date(codeData.expiresAt)
      
      if (expiresAt > new Date()) {
        stored = {
          code: codeData.code,
          expiresAt: expiresAt,
          userId: userId,
          createdAt: new Date(codeData.createdAt)
        }
        // Восстанавливаем в память
        verificationCodes.set(userId, stored)
        verificationCodesBackup.set(userId, { ...stored })
      } else {
        // Удаляем истекший код из БД
        await prisma.settings.delete({ where: { id: dbCode.id } })
      }
    }
  }
  
  // 4. Проверка существования кода
  if (!stored) {
    return false
  }
  
  // 5. Проверка срока действия
  if (new Date() > stored.expiresAt) {
    // Удаляем истекший код
    verificationCodes.delete(userId)
    verificationCodesBackup.delete(userId)
    await prisma.settings.deleteMany({
      where: { key: { startsWith: `verification_code_${userId}_` } }
    })
    return false
  }
  
  // 6. Проверка соответствия кода
  if (stored.code !== inputCode) {
    return false
  }
  
  // 7. Код верный, удаляем его из всех хранилищ
  verificationCodes.delete(userId)
  verificationCodesBackup.delete(userId)
  await prisma.settings.deleteMany({
    where: { key: { startsWith: `verification_code_${userId}_` } }
  })
  
  return true
}
```

**Процесс проверки:**
1. Поиск в основном хранилище памяти
2. Поиск в резервном хранилище памяти
3. Поиск в базе данных (если не найдено в памяти)
4. Проверка срока действия
5. Сравнение кодов
6. Удаление кода после успешной проверки

**Безопасность:**
- Код удаляется после использования (одноразовый)
- Проверка срока действия
- Защита от повторного использования

### 6.4 API Endpoint: `/api/auth/verify-code`

**Расположение:** `src/app/api/auth/verify-code/route.ts`

**Метод:** `POST`

**Тело запроса:**
```json
{
  "userId": "uuid",
  "code": "123456"
}
```

**Процесс:**
```typescript
export async function POST(request: NextRequest) {
  const { userId, code } = await request.json()

  // Валидация
  if (!userId || !code) {
    return NextResponse.json(
      { error: 'ID пользователя и код обязательны' },
      { status: 400 }
    )
  }

  // Проверка кода
  const isValid = await verifyCode(userId, code)
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Неверный или истекший код' },
      { status: 401 }
    )
  }

  // Получение данных пользователя
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      login: true,
      role: true,
      status: true
    }
  })

  // Проверка статуса
  if (user.status === 'banned' || user.status === 'deleted') {
    return NextResponse.json(
      { error: 'Аккаунт заблокирован или удален' },
      { status: 403 }
    )
  }

  // Генерация нового JWT токена
  const token = generateToken({
    userId: user.id,
    login: user.login,
    role: user.role
  })

  // Установка токена в cookies
  const response = NextResponse.json({
    success: true,
    message: 'Код подтвержден успешно',
    token,
    user: {
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role
    }
  })
  
  response.cookies.set('auth-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })
  
  return response
}
```

**Ответ при успехе:**
```json
{
  "success": true,
  "message": "Код подтвержден успешно",
  "token": "jwt_token_string",
  "user": {
    "id": "uuid",
    "name": "string",
    "login": "string",
    "role": "admin|teacher|student"
  }
}
```

### 6.5 API Endpoint: `/api/auth/resend-code`

**Расположение:** `src/app/api/auth/resend-code/route.ts`

**Метод:** `POST`

**Тело запроса:**
```json
{
  "userId": "uuid"
}
```

**Процесс:**
```typescript
export async function POST(request: NextRequest) {
  const { userId } = await request.json()

  // Валидация
  if (!userId) {
    return NextResponse.json(
      { error: 'ID пользователя обязателен' },
      { status: 400 }
    )
  }

  // Получение пользователя
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      telegram_id: true,
      status: true
    }
  })

  // Проверки
  if (!user) {
    return NextResponse.json(
      { error: 'Пользователь не найден' },
      { status: 404 }
    )
  }

  if (!user.telegram_id) {
    return NextResponse.json(
      { error: 'У пользователя не привязан Telegram' },
      { status: 400 }
    )
  }

  if (user.status === 'banned' || user.status === 'deleted') {
    return NextResponse.json(
      { error: 'Аккаунт заблокирован или удален' },
      { status: 403 }
    )
  }

  // Генерация нового кода
  const verificationCode = generateVerificationCode()
  await storeVerificationCode(user.id, verificationCode)

  // Отправка в Telegram
  const messageSent = await telegramService.sendVerificationCode(
    user.telegram_id, 
    verificationCode
  )
  
  if (!messageSent) {
    return NextResponse.json({
      error: 'Ошибка отправки кода в Telegram'
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Новый код подтверждения отправлен в Telegram'
  })
}
```

**Ответ при успехе:**
```json
{
  "success": true,
  "message": "Новый код подтверждения отправлен в Telegram"
}
```

---

## 7. Интеграция с Telegram

### 7.1 Telegram Service

**Класс:** `TelegramService`

**Расположение:** `src/lib/telegram.ts`

**Экспорт:** `telegramService` (singleton)

### 7.2 Получение токена бота

**Метод:** `getBotToken(tokenType: 'ADMIN_BOT_TOKEN' | 'STUDENT_BOT_TOKEN'): Promise<string>`

**Реализация:**
```typescript
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
```

**Источник данных:**
- **Таблица:** `settings`
- **Ключ:** `ADMIN_BOT_TOKEN` или `STUDENT_BOT_TOKEN`
- **Значение:** Токен бота Telegram (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Кэширование:**
- Токен админского бота кэшируется в памяти
- Токен студенческого бота получается каждый раз из БД

### 7.3 Отправка сообщения

**Метод:** `sendMessage(chatId: string, message: string): Promise<boolean>`

**Реализация:**
```typescript
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
```

**API Endpoint:** `https://api.telegram.org/bot{token}/sendMessage`

**Параметры:**
- `chat_id` - Telegram ID пользователя (строка)
- `text` - Текст сообщения
- `parse_mode` - `Markdown` (поддержка форматирования)

**Возвращаемое значение:**
- `true` - сообщение отправлено успешно
- `false` - ошибка отправки

### 7.4 Отправка кода подтверждения

**Метод:** `sendVerificationCode(telegramId: string, code: string): Promise<boolean>`

**Реализация:**
```typescript
async sendVerificationCode(telegramId: string, code: string): Promise<boolean> {
  const message = `🔐 *Код подтверждения входа*

Ваш код: \`${code}\`

Введите этот код на странице авторизации для завершения входа в систему.

⏰ Код действителен в течение 5 минут.`

  return await this.sendMessage(telegramId, message)
}
```

**Формат сообщения:**
- Использует Markdown форматирование
- Код выделен в моноширинный текст (`` `code` ``)
- Содержит инструкции и информацию о сроке действия

**Источник данных:**
- `telegramId` - берется из поля `telegram_id` таблицы `users`
- `code` - генерируется функцией `generateVerificationCode()`

### 7.5 Отправка рассылки

**Метод:** `sendBroadcast(telegramIds: string[], message: string, options?): Promise<{success, failed, errors}>`

**Реализация:**
```typescript
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
```

**Особенности:**
- Использует токен студенческого бота (`STUDENT_BOT_TOKEN`)
- Отправка пакетами по 30 сообщений (лимит Telegram API)
- Задержка 1 секунда между пакетами
- Поддержка кнопок (inline keyboard)
- Возвращает статистику успешных/неудачных отправок

---

## 8. Клиентская аутентификация

### 8.1 AuthContext

**Расположение:** `src/contexts/AuthContext.tsx`

**Интерфейс:**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Состояния:**
- `user` - данные текущего пользователя
- `loading` - состояние загрузки
- `error` - сообщение об ошибке

**Методы:**
- `logout()` - выход из системы
- `refreshUser()` - обновление данных пользователя

### 8.2 Загрузка пользователя

**Функция:** `loadUser(showLoading: boolean)`

**Процесс:**
```typescript
const loadUser = useCallback(async (showLoading = true) => {
  setLoading(showLoading)
  setError(null)

  const token = getAuthToken()
  
  if (!token) {
    setUser(null)
    setLoading(false)
    return
  }

  // Проверка актуальности данных через API
  const response = await apiRequest('/api/user/me')
  
  if (response.ok) {
    const currentUser = await response.json()
    setUser(currentUser)
    localStorage.setItem('user', JSON.stringify(currentUser))
    setError(null)
  } else if (response.status === 401) {
    // Токен истек или невалиден
    removeAuthToken()
    setUser(null)
    setError('Сессия истекла')
  } else if (response.status === 403) {
    // Нет прав доступа
    setError('Доступ запрещен')
  } else if (response.status === 503) {
    // Проблемы с БД
    setError('Сервис временно недоступен')
  }
  
  setLoading(false)
}, [])
```

**Источник данных:**
- Токен из cookies (`getAuthToken()`)
- Данные пользователя из API (`/api/user/me`)
- Кэш в `localStorage` (для быстрого отображения)

### 8.3 API Endpoint: `/api/user/me`

**Расположение:** `src/app/api/user/me/route.ts`

**Метод:** `GET`

**Реализация:**
```typescript
export async function GET(request: NextRequest) {
  return authenticatedHandler(request, async (user) => {
    return NextResponse.json(user)
  })
}
```

**Процесс:**
1. Проверка аутентификации через `authenticatedHandler`
2. Возврат данных пользователя из БД

**Ответ:**
```json
{
  "id": "uuid",
  "name": "string",
  "login": "string",
  "profile_photo_url": "string|null",
  "role": "admin|teacher|student",
  "status": "registered|verified|banned|deleted",
  "telegram_id": "string|null"
}
```

### 8.4 Выход из системы

**API Endpoint:** `/api/auth/logout`

**Расположение:** `src/app/api/auth/logout/route.ts`

**Метод:** `POST`

**Реализация:**
```typescript
export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Выход выполнен успешно'
  })

  // Удаление cookie с токеном
  response.cookies.delete('auth-token')
  
  return response
}
```

**Клиентская часть:**
```typescript
const logout = useCallback(async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Очистка данных в любом случае
    removeAuthToken()
    setUser(null)
    setError(null)
    window.location.href = '/login'
  }
}, [])
```

---

## 9. Безопасность

### 9.1 Хеширование паролей

**Алгоритм:** bcrypt
**Salt rounds:** 12
**Время хеширования:** ~300-500ms

**Защита:**
- Защита от rainbow tables (использование salt)
- Защита от brute-force (медленное хеширование)
- Константное время сравнения (защита от timing attacks)

### 9.2 JWT токены

**Алгоритм:** HS256
**Секретный ключ:** `JWT_SECRET` из переменных окружения
**Срок действия:** 7 дней

**Защита:**
- Подпись токена (невозможность подделки)
- Срок действия (автоматическое истечение)
- Проверка на сервере при каждом запросе

**Рекомендации:**
- Использовать сильный секретный ключ (минимум 32 символа)
- Хранить `JWT_SECRET` в переменных окружения
- Не передавать токен в URL (только в заголовках или cookies)

### 9.3 Cookies

**Параметры безопасности:**
- `httpOnly: false` - необходимо для клиентской аутентификации
- `secure: true` (в production) - передача только по HTTPS
- `sameSite: 'lax'` - защита от CSRF
- `maxAge: 7 дней` - ограниченный срок действия

**Защита от CSRF:**
- `sameSite: 'lax'` предотвращает отправку cookies с внешних сайтов
- Проверка токена на сервере при каждом запросе

### 9.4 Коды подтверждения

**Характеристики:**
- Длина: 6 цифр
- Срок действия: 5 минут
- Одноразовое использование (удаляется после проверки)

**Защита:**
- Ограниченный срок действия
- Одноразовость
- Хранение в памяти и БД (дублирование)

**Рекомендации:**
- Не логировать коды в production
- Ограничить количество попыток ввода кода
- Использовать rate limiting для API endpoints

### 9.5 Валидация входных данных

**Проверки:**
- Наличие обязательных полей
- Формат данных
- Существование пользователя
- Статус пользователя
- Валидность пароля/кода

**Сообщения об ошибках:**
- Не раскрывают детали (например, "Неверный логин или пароль" вместо "Пользователь не найден")
- Единообразные сообщения для одинаковых ошибок

### 9.6 Обработка ошибок

**Типы ошибок:**
- `400` - Неверные входные данные
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера
- `503` - Сервис недоступен (проблемы с БД)

**Логирование:**
- Ошибки логируются на сервере
- Чувствительные данные не логируются
- Детальные логи только в development режиме

---

## 10. Переменные окружения

### 10.1 Необходимые переменные

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Node Environment
NODE_ENV="production" | "development"
```

### 10.2 Настройки в базе данных (таблица `settings`)

| Ключ | Описание | Пример |
|------|----------|--------|
| `ADMIN_BOT_TOKEN` | Токен Telegram бота для админов | `123456789:ABCdef...` |
| `STUDENT_BOT_TOKEN` | Токен Telegram бота для студентов | `987654321:XYZabc...` |

**Получение токена:**
1. Создать бота через [@BotFather](https://t.me/BotFather) в Telegram
2. Получить токен
3. Сохранить в таблице `settings` с соответствующим ключом

---

## 11. Схема базы данных

### 11.1 Таблица `users`

**Поля, используемые в аутентификации:**

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `login` | String | Логин (уникальный) |
| `hash_password` | String | Хешированный пароль (bcrypt) |
| `name` | String | Имя пользователя |
| `role` | Enum | `admin`, `teacher`, `student` |
| `status` | Enum | `registered`, `verified`, `banned`, `deleted` |
| `telegram_id` | String? | Telegram ID пользователя |
| `profile_photo_url` | String? | URL фото профиля |

### 11.2 Таблица `settings`

**Используется для:**
- Хранения токенов Telegram ботов
- Хранения кодов подтверждения (временные)

**Структура:**

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `key` | String | Ключ настройки |
| `value` | String | Значение (может быть JSON) |
| `created_at` | DateTime | Время создания |

**Примеры ключей:**
- `ADMIN_BOT_TOKEN` - токен админского бота
- `STUDENT_BOT_TOKEN` - токен студенческого бота
- `verification_code_{userId}_{timestamp}` - код подтверждения

---

## 12. Поток аутентификации (диаграмма)

### 12.1 Полный поток входа с Telegram 2FA

```
┌─────────┐
│ Клиент  │
└────┬────┘
     │ 1. POST /api/auth/login {login, password}
     ▼
┌─────────────────┐
│  API: /login    │
└────┬────────────┘
     │ 2. Проверка пароля
     ▼
┌─────────────────┐
│   Database      │
│   (users)       │
└────┬────────────┘
     │ 3. Получение пользователя
     ▼
┌─────────────────┐
│  API: /login    │
└────┬────────────┘
     │ 4. Генерация JWT токена
     │ 5. Генерация кода подтверждения
     │ 6. Сохранение кода (память + БД)
     ▼
┌─────────────────┐
│ Telegram Service│
└────┬────────────┘
     │ 7. Отправка кода в Telegram
     ▼
┌─────────────────┐
│ Telegram API    │
└────┬────────────┘
     │ 8. Сообщение пользователю
     ▼
┌─────────┐
│ Клиент  │
│ (Telegram)
└─────────┘

     │ 9. Ввод кода на странице
     ▼
┌─────────────────┐
│  API: /verify   │
│  -code          │
└────┬────────────┘
     │ 10. Проверка кода
     ▼
┌─────────────────┐
│ Verification    │
│ Service         │
└────┬────────────┘
     │ 11. Валидация кода
     │ 12. Генерация нового JWT
     │ 13. Установка cookie
     ▼
┌─────────┐
│ Клиент  │
│ (Dashboard)
└─────────┘
```

### 12.2 Поток проверки аутентификации

```
┌─────────┐
│ Клиент  │
└────┬────┘
     │ 1. Запрос с Authorization: Bearer <token>
     ▼
┌─────────────────┐
│  auth()         │
└────┬────────────┘
     │ 2. Извлечение токена
     │ 3. verifyToken()
     ▼
┌─────────────────┐
│  JWT Verify     │
└────┬────────────┘
     │ 4. Проверка подписи и срока
     ▼
┌─────────────────┐
│  Database       │
│  (users)        │
└────┬────────────┘
     │ 5. Получение актуальных данных
     │ 6. Проверка статуса
     ▼
┌─────────────────┐
│  Handler        │
└────┬────────────┘
     │ 7. Выполнение бизнес-логики
     ▼
┌─────────┐
│ Клиент  │
│ (Response)
└─────────┘
```

---

## 13. Рекомендации по безопасности

### 13.1 Production

1. **JWT_SECRET:**
   - Использовать криптографически стойкий ключ (минимум 32 символа)
   - Генерировать случайным образом
   - Хранить только в переменных окружения

2. **HTTPS:**
   - Обязательно использовать HTTPS в production
   - Установить `secure: true` для cookies

3. **Rate Limiting:**
   - Ограничить количество попыток входа
   - Ограничить количество запросов на проверку кода
   - Использовать middleware для rate limiting

4. **Логирование:**
   - Не логировать пароли и токены
   - Не логировать коды подтверждения
   - Логировать только ошибки и важные события

5. **База данных:**
   - Использовать connection pooling
   - Регулярно делать бэкапы
   - Мониторить производительность

### 13.2 Development

1. **Переменные окружения:**
   - Использовать `.env.local` для локальных настроек
   - Не коммитить `.env` файлы в git

2. **Тестирование:**
   - Тестировать все сценарии входа
   - Тестировать обработку ошибок
   - Тестировать истечение токенов

---

## 14. Заключение

Система аутентификации Bilimpoz Admin обеспечивает:

✅ **Безопасность:**
- Хеширование паролей (bcrypt)
- JWT токены с подписью
- Двухфакторная аутентификация через Telegram
- Защита от CSRF (sameSite cookies)

✅ **Надежность:**
- Дублирование хранения кодов (память + БД)
- Обработка ошибок подключения к БД
- Автоматическая очистка истекших кодов

✅ **Удобство:**
- Автоматическое обновление данных пользователя
- Синхронизация между вкладками
- Кэширование в localStorage

✅ **Масштабируемость:**
- Модульная архитектура
- Разделение ответственности
- Легкое добавление новых методов аутентификации

---

**Версия документа:** 1.0  
**Дата последнего обновления:** 2024  
**Автор:** Bilimpoz Admin Development Team

