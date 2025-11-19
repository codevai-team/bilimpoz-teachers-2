# Логика сохранения изображений и хранения в S3

Этот документ описывает полную логику работы с S3 для сохранения и хранения изображений в проекте.

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Конфигурация S3](#конфигурация-s3)
3. [Структура хранения файлов](#структура-хранения-файлов)
4. [Процесс загрузки изображений](#процесс-загрузки-изображений)
5. [Валидация файлов](#валидация-файлов)
6. [Генерация имен файлов](#генерация-имен-файлов)
7. [Удаление файлов](#удаление-файлов)
8. [API эндпоинты](#api-эндпоинты)
9. [Примеры использования](#примеры-использования)
10. [Обработка ошибок](#обработка-ошибок)

---

## Обзор архитектуры

### Компоненты системы:

```
┌─────────────────┐
│  Frontend       │
│  (React/Next.js)│
└────────┬────────┘
         │ FormData
         ▼
┌─────────────────┐
│  API Route      │
│  (Next.js API)  │
└────────┬────────┘
         │
         ├─► Валидация файла
         ├─► Генерация имени
         ├─► Конвертация в Buffer
         │
         ▼
┌─────────────────┐
│  S3 Library     │
│  (src/lib/s3.ts) │
└────────┬────────┘
         │
         ├─► Получение конфигурации
         ├─► Создание S3 клиента
         ├─► Загрузка в S3
         │
         ▼
┌─────────────────┐
│  S3 Storage     │
│  (AWS/MinIO)    │
└─────────────────┘
```

### Поток данных:

1. **Клиент** отправляет файл через FormData
2. **API Route** валидирует и обрабатывает файл
3. **S3 Library** загружает файл в S3
4. **База данных** сохраняет URL файла
5. **Клиент** получает URL для отображения

---

## Конфигурация S3

### Источники конфигурации:

Система поддерживает два источника настроек (в порядке приоритета):

1. **База данных** (таблица `settings`)
2. **Переменные окружения** (fallback)

### Настройки в БД:

```sql
-- Таблица settings
INSERT INTO settings (key, value) VALUES
  ('S3_URL', 'https://s3.example.com'),
  ('S3_ACCESS_KEY', 'your-access-key'),
  ('S3_SECRET_ACCESS_KEY', 'your-secret-key'),
  ('BUCKET_NAME', 'bilimpoz-storage');
```

### Переменные окружения:

```env
# .env
S3_URL=https://s3.example.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
BUCKET_NAME=bilimpoz-storage
```

### Кэширование конфигурации:

```typescript
// Кэш настроек S3
let s3ConfigCache: S3Config | null = null;
let s3ConfigCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 минут
```

**Логика кэширования:**
- Настройки кэшируются на 5 минут
- При истечении TTL загружаются заново из БД
- Можно очистить кэш через `clearS3ConfigCache()`

### Получение конфигурации:

```typescript
async function getS3Config(): Promise<S3Config> {
  // 1. Проверка кэша
  const now = Date.now();
  if (s3ConfigCache && (now - s3ConfigCacheTime) < CACHE_TTL) {
    return s3ConfigCache;
  }

  // 2. Загрузка из БД
  const settings = await prisma.settings.findMany({
    where: {
      key: {
        in: ['S3_URL', 'S3_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY', 'BUCKET_NAME']
      }
    }
  });

  // 3. Fallback на переменные окружения
  const endpoint = configMap['S3_URL'] || process.env.S3_URL;
  const accessKeyId = configMap['S3_ACCESS_KEY'] || process.env.S3_ACCESS_KEY;
  const secretAccessKey = configMap['S3_SECRET_ACCESS_KEY'] || process.env.S3_SECRET_ACCESS_KEY;
  const bucketName = configMap['BUCKET_NAME'] || process.env.BUCKET_NAME;

  // 4. Валидация наличия всех настроек
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Не все настройки S3 найдены');
  }

  // 5. Сохранение в кэш
  s3ConfigCache = { endpoint, accessKeyId, secretAccessKey, bucketName };
  s3ConfigCacheTime = now;

  return s3ConfigCache;
}
```

### Создание S3 клиента:

```typescript
async function getS3Client(): Promise<S3Client> {
  const config = await getS3Config();
  
  return new S3Client({
    endpoint: config.endpoint,
    region: 'auto', // Для совместимости
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Для MinIO и других S3-совместимых сервисов
  });
}
```

---

## Структура хранения файлов

### Базовая структура:

```
bilimpoz/
├── courses/
│   ├── images/          # Изображения курсов
│   └── videos/           # Видео курсов
├── lessons/
│   ├── videos/         # Видео уроков
│   ├── lecture-images/ # Изображения лекций
│   ├── lectures/       # Текстовые лекции (MD)
│   └── lesson-test-images/ # Изображения тестов уроков
├── users/
│   └── profile-photos/  # Фото профилей пользователей
├── teachers/
│   ├── teacher_profile_photos/ # Фото профилей учителей
│   └── question_pictures/     # Изображения вопросов
├── newsletters/
│   └── images/         # Изображения рассылок
└── misc/               # Прочие файлы
```

### Функция получения пути:

```typescript
export function getS3Path(
  type: 'course-images' | 'course-videos' | 
       'lesson-videos' | 'lesson-images' | 
       'lesson-documents' | 'lesson-lectures' | 
       'lesson-test-images' | 'profile-photos' | 
       'newsletter-images' | 'teacher-profile-photos' | 
       'question-pictures'
): string {
  const basePath = 'bilimpoz';
  
  switch (type) {
    case 'course-images':
      return `${basePath}/courses/images`;
    case 'course-videos':
      return `${basePath}/courses/videos`;
    case 'lesson-videos':
      return `${basePath}/lessons/videos`;
    case 'lesson-images':
      return `${basePath}/lessons/lecture-images`;
    case 'lesson-documents':
      return `${basePath}/lessons/lecture-images`;
    case 'lesson-lectures':
      return `${basePath}/lessons/lectures`;
    case 'lesson-test-images':
      return `${basePath}/lessons/lesson-test-images`;
    case 'profile-photos':
      return `${basePath}/users/profile-photos`;
    case 'newsletter-images':
      return `${basePath}/newsletters/images`;
    case 'teacher-profile-photos':
      return `${basePath}/teachers/teacher_profile_photos`;
    case 'question-pictures':
      return `${basePath}/teachers/question_pictures`;
    default:
      return `${basePath}/misc`;
  }
}
```

### Примеры путей:

| Тип файла | Путь в S3 |
|-----------|-----------|
| Фото профиля учителя | `bilimpoz/teachers/teacher_profile_photos/1234567890-abc123.jpg` |
| Изображение вопроса | `bilimpoz/teachers/question_pictures/1234567890-xyz789.png` |
| Изображение курса | `bilimpoz/courses/images/1234567890-course.jpg` |
| Видео урока | `bilimpoz/lessons/videos/1234567890-lesson.mp4` |

---

## Процесс загрузки изображений

### Шаг 1: Получение файла от клиента

```typescript
// API Route
const formData = await request.formData();
const file = formData.get('file') as File;

if (!file) {
  return NextResponse.json(
    { success: false, message: 'Файл не предоставлен' },
    { status: 400 }
  );
}
```

### Шаг 2: Валидация файла

```typescript
// Валидация типа и размера
const validation = validateFile(
  { size: file.size, mimetype: file.type },
  'image'
);

if (!validation.isValid) {
  return NextResponse.json(
    { success: false, message: validation.error },
    { status: 400 }
  );
}
```

### Шаг 3: Генерация имени файла

```typescript
// Генерация уникального имени
const fileName = generateFileName(file.name, 'profile');
// Результат: "1234567890-abc123def456.jpg"
```

### Шаг 4: Конвертация в Buffer

```typescript
// Конвертация File в Buffer
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
```

### Шаг 5: Определение пути в S3

```typescript
// Получение пути для типа файла
const s3Path = getS3Path('teacher-profile-photos');
// Результат: "bilimpoz/teachers/teacher_profile_photos"
```

### Шаг 6: Загрузка в S3

```typescript
// Загрузка файла в S3
const fileUrl = await uploadFileToS3(
  buffer,           // Buffer с данными файла
  fileName,         // Имя файла
  file.type,        // Content-Type (image/jpeg, image/png, etc.)
  s3Path           // Путь в S3
);
```

### Шаг 7: Сохранение URL в БД

```typescript
// Обновление записи в БД
await prisma.users.update({
  where: { id: user.id },
  data: {
    profile_photo_url: fileUrl,
    updated_at: new Date()
  }
});
```

### Шаг 8: Удаление старого файла (опционально)

```typescript
// Удаление старого файла из S3
if (currentUser?.profile_photo_url) {
  try {
    await deleteFileFromS3(currentUser.profile_photo_url);
  } catch (error) {
    // Логируем, но не прерываем процесс
    console.warn('Не удалось удалить старое фото:', error);
  }
}
```

### Полный процесс загрузки:

```typescript
export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  s3Path: string
): Promise<string> {
  // 1. Нормализация пути
  const normalizedPath = s3Path.replace(/\/+/g, '/');
  const normalizedFileName = fileName.replace(/^\/+/, '');
  const key = `${normalizedPath}/${normalizedFileName}`.replace(/\/+/g, '/');
  
  // 2. Получение S3 клиента и bucket
  const s3Client = await getS3Client();
  const bucketName = await getBucketName();
  
  // 3. Создание команды загрузки
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read', // Публичный доступ для чтения
  });

  // 4. Выполнение загрузки
  await s3Client.send(command);
  
  // 5. Формирование публичного URL
  const s3Url = await getS3Url();
  return `${s3Url}/${bucketName}/${key}`;
}
```

---

## Валидация файлов

### Разрешенные типы:

```typescript
// Изображения
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// Видео
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg'
];

// Все типы
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES
];
```

### Максимальные размеры:

```typescript
// Изображения: 10MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Видео: 100MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
```

### Функция валидации:

```typescript
export function validateFile(
  file: { size: number; mimetype: string },
  type: 'image' | 'video'
): { isValid: boolean; error?: string } {
  const allowedTypes = type === 'image' 
    ? ALLOWED_IMAGE_TYPES 
    : ALLOWED_VIDEO_TYPES;
  const maxSize = type === 'image' 
    ? MAX_IMAGE_SIZE 
    : MAX_VIDEO_SIZE;

  // Проверка типа файла
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`
    };
  }

  // Проверка размера
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `Файл слишком большой. Максимальный размер: ${maxSizeMB}MB`
    };
  }

  return { isValid: true };
}
```

### Примеры валидации:

```typescript
// ✅ Валидный файл
validateFile(
  { size: 5 * 1024 * 1024, mimetype: 'image/jpeg' },
  'image'
);
// Результат: { isValid: true }

// ❌ Неверный тип
validateFile(
  { size: 5 * 1024 * 1024, mimetype: 'image/gif' },
  'image'
);
// Результат: { isValid: false, error: 'Неподдерживаемый тип файла...' }

// ❌ Слишком большой
validateFile(
  { size: 15 * 1024 * 1024, mimetype: 'image/jpeg' },
  'image'
);
// Результат: { isValid: false, error: 'Файл слишком большой. Максимальный размер: 10MB' }
```

---

## Генерация имен файлов

### Алгоритм генерации:

```typescript
export function generateFileName(
  originalName: string,
  prefix: string = ''
): string {
  // 1. Таймстамп (миллисекунды)
  const timestamp = Date.now();
  
  // 2. Случайная строка (base36)
  const randomString = Math.random()
    .toString(36)
    .substring(2, 15);
  
  // 3. Расширение из оригинального имени
  const extension = originalName.split('.').pop();
  
  // 4. Формирование имени
  return `${timestamp}-${randomString}.${extension}`;
}
```

### Примеры:

| Оригинальное имя | Результат |
|------------------|-----------|
| `photo.jpg` | `1234567890-abc123def456.jpg` |
| `image.png` | `1234567891-xyz789ghi012.png` |
| `avatar.webp` | `1234567892-mno345pqr678.webp` |

### Преимущества:

1. **Уникальность**: Комбинация timestamp + random гарантирует уникальность
2. **Сортировка**: Timestamp позволяет сортировать по времени создания
3. **Безопасность**: Нет информации об оригинальном имени файла
4. **Простота**: Легко парсить и обрабатывать

---

## Удаление файлов

### Процесс удаления:

```typescript
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  try {
    // 1. Получение S3 клиента и bucket
    const s3Client = await getS3Client();
    const bucketName = await getBucketName();
    
    // 2. Извлечение ключа из URL
    const urlParts = fileUrl.split('/');
    const bucketIndex = urlParts.indexOf(bucketName);
    
    if (bucketIndex === -1) {
      throw new Error('Неверный URL файла');
    }
    
    // 3. Формирование ключа
    const key = urlParts.slice(bucketIndex + 1).join('/');
    
    // 4. Проверка, что это файл, а не папка
    if (key.endsWith('/') || !key.includes('.')) {
      throw new Error('Нельзя удалить папку, только файлы');
    }
    
    // 5. Создание команды удаления
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // 6. Выполнение удаления
    await s3Client.send(command);
  } catch (error) {
    console.error('Ошибка удаления файла из S3:', error);
    throw new Error('Не удалось удалить файл');
  }
}
```

### Примеры URL:

| URL | Извлеченный ключ |
|-----|------------------|
| `https://s3.example.com/bucket/bilimpoz/teachers/photo.jpg` | `bilimpoz/teachers/photo.jpg` |
| `https://s3.example.com/bucket/bilimpoz/users/profile.jpg` | `bilimpoz/users/profile.jpg` |

### Обработка ошибок:

```typescript
// Безопасное удаление с обработкой ошибок
try {
  await deleteFileFromS3(oldFileUrl);
  console.log('Файл успешно удален');
} catch (error) {
  // Логируем, но не прерываем процесс
  console.warn('Не удалось удалить файл:', error);
  // Продолжаем выполнение
}
```

---

## API эндпоинты

### 1. Загрузка фото профиля

**Эндпоинт:** `POST /api/auth/upload-profile-photo`

**Запрос:**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/auth/upload-profile-photo', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});
```

**Ответ:**
```json
{
  "success": true,
  "url": "https://s3.example.com/bucket/bilimpoz/teachers/teacher_profile_photos/1234567890-abc123.jpg",
  "message": "Фото профиля успешно загружено"
}
```

**Логика:**
1. Проверка авторизации
2. Валидация файла (тип, размер)
3. Получение текущего пользователя из БД
4. Генерация имени файла
5. Загрузка в S3
6. Обновление URL в БД
7. Удаление старого фото (если есть)

### 2. Загрузка изображения вопроса

**Эндпоинт:** `POST /api/teacher/upload/question-image`

**Запрос:**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('oldImageUrl', oldUrl); // Опционально

const response = await fetch('/api/teacher/upload/question-image', {
  method: 'POST',
  body: formData,
  credentials: 'include'
});
```

**Ответ:**
```json
{
  "success": true,
  "url": "https://s3.example.com/bucket/bilimpoz/teachers/question_pictures/1234567890-xyz789.png",
  "message": "Изображение успешно загружено"
}
```

**Логика:**
1. Проверка авторизации и роли (teacher)
2. Валидация файла
3. Генерация имени файла
4. Загрузка в S3
5. Удаление старого изображения (если передано)

### 3. Удаление изображения вопроса

**Эндпоинт:** `DELETE /api/teacher/upload/question-image?url={fileUrl}`

**Запрос:**
```typescript
const response = await fetch(
  `/api/teacher/upload/question-image?url=${encodeURIComponent(fileUrl)}`,
  {
    method: 'DELETE',
    credentials: 'include'
  }
);
```

**Ответ:**
```json
{
  "success": true,
  "message": "Изображение успешно удалено"
}
```

### 4. Загрузка фото профиля из Telegram URL

**Эндпоинт:** `POST /api/teacher/upload/profile-photo`

**Запрос:**
```json
{
  "telegramPhotoUrl": "https://api.telegram.org/file/bot...",
  "userId": "user_123"
}
```

**Ответ:**
```json
{
  "success": true,
  "url": "https://s3.example.com/bucket/bilimpoz/teachers/teacher_profile_photos/1234567890-abc123.jpg",
  "message": "Фото профиля успешно загружено в S3"
}
```

**Логика:**
1. Проверка авторизации и роли
2. Скачивание изображения из Telegram
3. Конвертация в Buffer
4. Генерация имени файла
5. Загрузка в S3

---

## Примеры использования

### Пример 1: Загрузка фото профиля (Frontend)

```typescript
// Компонент React
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Валидация на клиенте
  if (!file.type.startsWith('image/')) {
    showError('Разрешены только изображения');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError('Размер файла не должен превышать 10MB');
    return;
  }

  setUploadingPhoto(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/auth/upload-profile-photo', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const result = await response.json();

    if (result.success) {
      // Обновляем фото в состоянии
      setUser(prev => prev ? { 
        ...prev, 
        profilePhoto: result.url 
      } : null);
      showSuccess('Фото профиля успешно обновлено');
    } else {
      showError(result.message || 'Ошибка при загрузке фото');
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    showError('Ошибка при загрузке фото');
  } finally {
    setUploadingPhoto(false);
  }
};
```

### Пример 2: Загрузка изображения вопроса (API Route)

```typescript
// src/app/api/teacher/upload/question-image/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Авторизация
    const user = await auth(request);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Доступ только для учителей' },
        { status: 403 }
      );
    }

    // 2. Получение файла
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const oldImageUrl = formData.get('oldImageUrl') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    // 3. Валидация
    const validation = validateFile(
      { size: file.size, mimetype: file.type },
      'image'
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      );
    }

    // 4. Генерация имени и пути
    const fileName = generateFileName(file.name, 'question');
    const s3Path = getS3Path('question-pictures');

    // 5. Конвертация в Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 6. Загрузка в S3
    const fileUrl = await uploadFileToS3(
      buffer,
      fileName,
      file.type,
      s3Path
    );

    // 7. Удаление старого файла (если есть)
    if (oldImageUrl && oldImageUrl.trim() && oldImageUrl !== fileUrl) {
      try {
        await deleteFileFromS3(oldImageUrl);
      } catch (error) {
        console.warn('Не удалось удалить старое изображение:', error);
      }
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'Изображение успешно загружено'
    });

  } catch (error) {
    console.error('Upload question image error:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка при загрузке изображения' },
      { status: 500 }
    );
  }
}
```

### Пример 3: Скачивание и загрузка из URL

```typescript
// Скачивание изображения из Telegram и загрузка в S3
export async function downloadAndUploadToS3(
  imageUrl: string,
  fileName: string,
  s3Path: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  try {
    // 1. Скачивание изображения
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Не удалось скачать изображение: ${response.statusText}`);
    }

    // 2. Конвертация в Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Определение content-type
    const responseContentType = response.headers.get('content-type') || contentType;

    // 4. Загрузка в S3
    const fileUrl = await uploadFileToS3(
      buffer,
      fileName,
      responseContentType,
      s3Path
    );

    return fileUrl;
  } catch (error) {
    console.error('Ошибка скачивания и загрузки изображения в S3:', error);
    throw new Error('Не удалось скачать и загрузить изображение в S3');
  }
}
```

---

## Обработка ошибок

### Типы ошибок:

1. **Ошибки конфигурации:**
   - Не найдены настройки S3 в БД и переменных окружения
   - Неверный формат настроек

2. **Ошибки валидации:**
   - Неподдерживаемый тип файла
   - Превышен максимальный размер

3. **Ошибки загрузки:**
   - Ошибка подключения к S3
   - Ошибка записи файла
   - Недостаточно прав доступа

4. **Ошибки удаления:**
   - Файл не найден
   - Неверный URL файла
   - Ошибка доступа

### Обработка в API Route:

```typescript
try {
  // Загрузка файла
  const fileUrl = await uploadFileToS3(...);
  
  return NextResponse.json({
    success: true,
    url: fileUrl
  });
} catch (error) {
  console.error('Upload error:', error);
  
  // Определение типа ошибки
  if (error instanceof Error) {
    if (error.message.includes('настройки')) {
      return NextResponse.json(
        { success: false, message: 'Ошибка конфигурации S3' },
        { status: 500 }
      );
    }
    
    if (error.message.includes('размер') || error.message.includes('тип')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
  }
  
  return NextResponse.json(
    { success: false, message: 'Ошибка при загрузке файла' },
    { status: 500 }
  );
}
```

### Безопасное удаление:

```typescript
// Удаление старого файла с обработкой ошибок
if (oldFileUrl) {
  try {
    await deleteFileFromS3(oldFileUrl);
    console.log('Старый файл успешно удален');
  } catch (error) {
    // Логируем, но не прерываем процесс
    console.warn('Не удалось удалить старый файл:', error);
    // Продолжаем выполнение - новый файл уже загружен
  }
}
```

---

## Дополнительные функции

### Получение подписанного URL:

```typescript
// Для прямой загрузки с клиента (если нужно)
export async function getSignedUploadUrl(
  fileName: string,
  contentType: string,
  s3Path: string
): Promise<string> {
  const key = `${s3Path}/${fileName}`;
  
  const s3Client = await getS3Client();
  const bucketName = await getBucketName();
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  try {
    // URL действителен 1 час
    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    });
    return signedUrl;
  } catch (error) {
    console.error('Ошибка создания подписанного URL:', error);
    throw new Error('Не удалось создать подписанный URL');
  }
}
```

### Загрузка текстового контента:

```typescript
// Для сохранения лекций в формате Markdown
export async function uploadTextToS3(
  content: string,
  format: 'md' | 'txt',
  lessonId: string,
  oldLectureUrl?: string
): Promise<string> {
  // Удаление старого файла
  if (oldLectureUrl && oldLectureUrl.trim()) {
    try {
      await deleteFileFromS3(oldLectureUrl);
    } catch (error) {
      console.warn('Не удалось удалить старый файл лекции:', error);
    }
  }

  // Генерация имени файла
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileName = `lecture-${lessonId}-${timestamp}-${randomString}.md`;
  const s3Path = getS3Path('lesson-lectures');
  const key = `${s3Path}/${fileName}`;
  
  // Конвертация в Buffer
  const contentType = 'text/markdown';
  const buffer = Buffer.from(content, 'utf-8');
  
  // Загрузка в S3
  const s3Client = await getS3Client();
  const bucketName = await getBucketName();
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);
  
  // Возврат публичного URL
  const s3Url = await getS3Url();
  return `${s3Url}/${bucketName}/${key}`;
}
```

---

## Рекомендации по использованию

### 1. Валидация на клиенте:

✅ **Всегда валидируйте файлы на клиенте перед отправкой:**
```typescript
// Проверка типа
if (!file.type.startsWith('image/')) {
  return;
}

// Проверка размера
if (file.size > 10 * 1024 * 1024) {
  return;
}
```

### 2. Валидация на сервере:

✅ **Всегда валидируйте файлы на сервере:**
```typescript
const validation = validateFile(
  { size: file.size, mimetype: file.type },
  'image'
);

if (!validation.isValid) {
  return NextResponse.json(
    { success: false, message: validation.error },
    { status: 400 }
  );
}
```

### 3. Обработка ошибок:

✅ **Обрабатывайте ошибки gracefully:**
```typescript
try {
  await deleteFileFromS3(oldFileUrl);
} catch (error) {
  // Логируем, но не прерываем процесс
  console.warn('Не удалось удалить старый файл:', error);
}
```

### 4. Очистка кэша:

✅ **Очищайте кэш при обновлении настроек:**
```typescript
// После обновления настроек S3 в БД
clearS3ConfigCache();
```

### 5. Логирование:

✅ **Логируйте важные операции:**
```typescript
console.log('Файл успешно загружен:', fileUrl);
console.warn('Не удалось удалить старый файл:', error);
console.error('Ошибка загрузки файла в S3:', error);
```

---

## Структура URL файлов

### Формат URL:

```
{S3_URL}/{BUCKET_NAME}/{S3_PATH}/{FILE_NAME}
```

### Примеры:

```
https://s3.example.com/bilimpoz-storage/bilimpoz/teachers/teacher_profile_photos/1234567890-abc123.jpg
```

**Разбор URL:**
- `S3_URL`: `https://s3.example.com`
- `BUCKET_NAME`: `bilimpoz-storage`
- `S3_PATH`: `bilimpoz/teachers/teacher_profile_photos`
- `FILE_NAME`: `1234567890-abc123.jpg`

### Извлечение ключа из URL:

```typescript
// Для удаления файла
const urlParts = fileUrl.split('/');
const bucketIndex = urlParts.indexOf(bucketName);
const key = urlParts.slice(bucketIndex + 1).join('/');
// Результат: "bilimpoz/teachers/teacher_profile_photos/1234567890-abc123.jpg"
```

---

## Безопасность

### 1. Публичный доступ:

```typescript
// Файлы загружаются с ACL: 'public-read'
// Это означает, что они доступны по прямому URL
ACL: 'public-read'
```

### 2. Валидация типов:

✅ **Разрешены только безопасные типы:**
- Изображения: JPEG, PNG, WebP
- Видео: MP4, WebM, OGG

### 3. Ограничение размера:

✅ **Максимальные размеры:**
- Изображения: 10MB
- Видео: 100MB

### 4. Уникальные имена:

✅ **Имена файлов генерируются автоматически:**
- Нет возможности указать произвольное имя
- Исключает path traversal атаки

### 5. Авторизация:

✅ **Все API эндпоинты требуют авторизации:**
```typescript
const user = await auth(request);
if (!user) {
  return NextResponse.json(
    { success: false, message: 'Необходима авторизация' },
    { status: 401 }
  );
}
```

---

## Заключение

Система хранения изображений в S3 включает:

1. **Гибкую конфигурацию** - настройки из БД или переменных окружения
2. **Кэширование** - оптимизация производительности
3. **Валидацию** - проверка типа и размера файлов
4. **Уникальные имена** - безопасная генерация имен файлов
5. **Структурированное хранение** - организация по типам контента
6. **Обработку ошибок** - graceful handling всех ошибок
7. **Удаление старых файлов** - автоматическая очистка

**Дата создания:** 2025-01-16  
**Версия:** 1.0

