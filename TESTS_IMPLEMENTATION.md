# Реализация раздела "Тесты" - Краткое руководство

Документация по реализации системы создания и управления тестами для учителей.

## 📋 Содержание

1. [Архитектура](#архитектура)
2. [Типы вопросов](#типы-вопросов)
3. [Создание теста](#создание-теста)
4. [Редактирование теста](#редактирование-теста)
5. [Публикация теста](#публикация-теста)
6. [Хранение данных](#хранение-данных)
7. [API эндпоинты](#api-эндпоинты)
8. [Структура БД](#структура-бд)

---

## Архитектура

### Гибридное хранение:

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │
         ├─► localStorage (черновики)
         │   - Тесты (draft)
         │   - Вопросы (draft)
         │   - Статусы
         │
         └─► API → БД (опубликованные)
             - Тесты (published)
             - Вопросы (published)
```

### Поток работы:

1. **Создание** → localStorage (draft)
2. **Редактирование** → localStorage (draft)
3. **Публикация** → БД (published)
4. **Обновление** → БД (published)

---

## Типы вопросов

### 1. Standard (Стандартный)
- **Метка**: С (серая)
- **Варианты**: 2-10+ (динамические)
- **Применение**: Универсальные тесты

### 2. Analogy (Аналогия)
- **Метка**: А (зелёная)
- **Варианты**: 4 фиксированных (А, Б, В, Г)
- **Применение**: Логические тесты, закономерности

### 3. Grammar (Грамматика)
- **Метка**: Г (красная)
- **Варианты**: 4 фиксированных (А, Б, В, Г)
- **Применение**: Тесты по языку

### 4. Math1 (Математика 1)
- **Метка**: М1 (синяя)
- **Варианты**: 4 (А и Б - поля ввода, В и Г - фиксированные)
- **Применение**: Сравнение величин

### 5. Math2 (Математика 2)
- **Метка**: М2 (фиолетовая)
- **Варианты**: 4 фиксированных
- **Применение**: Математические задачи

### 6. RAC (Reading and Comprehension)
- **Метка**: Р (оранжевая)
- **Варианты**: 4 фиксированных
- **Применение**: Чтение и понимание текста

---

## Создание теста

### Шаг 1: Создание черновика

```typescript
// Генерация временного ID
const tempTestId = generateTempId(); // "temp-1234567890-abc"

// Сохранение в localStorage
const draftTest = {
  id: tempTestId,
  name: "Название теста",
  description: "Описание",
  language: 'ru' | 'kg',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  teacherId: teacherId
};

saveDraftTest(draftTest);
setTestStatus(tempTestId, 'draft');
```

### Шаг 2: Переход в редактор

```typescript
router.push(`/dashboard/tests/${tempTestId}`);
```

### Шаг 3: Добавление вопросов

```typescript
// Создание вопроса
const newQuestion: Question = {
  id: generateTempId(), // Временный ID
  question: "Текст вопроса",
  answerVariants: [
    { value: "Вариант 1", isCorrect: true },
    { value: "Вариант 2", isCorrect: false }
  ],
  type: 'standard',
  points: 1,
  timeLimit: 60,
  language: 'ru',
  order: questions.length
};

// Сохранение в localStorage
TestLocalStorage.save(newQuestion.id, {
  question: newQuestion.question,
  answers: newQuestion.answerVariants,
  points: newQuestion.points,
  timeLimit: newQuestion.timeLimit,
  language: newQuestion.language
}, newQuestion.type);

// Привязка к тесту
TestLocalStorage.addQuestionToTest(testId, newQuestion.id, newQuestion.type);
```

---

## Редактирование теста

### Загрузка данных:

```typescript
// 1. Загрузка теста
if (isTempId(testId)) {
  // Из localStorage
  const draftTest = getDraftTest(testId);
  setTest(draftTest);
} else {
  // Из БД
  const response = await fetch(`/api/teacher/tests/${testId}`);
  const test = await response.json();
  setTest(test);
}

// 2. Загрузка вопросов
// Из БД (опубликованные)
const dbQuestions = await fetch(`/api/teacher/tests/${testId}/questions`);

// Из localStorage (черновики + новые)
const localStorageQuestions = TestLocalStorage.getTestQuestions(testId);

// Объединение
const allQuestions = [...dbQuestions, ...localStorageQuestions];
```

### Сохранение изменений:

```typescript
// Автосохранение в localStorage при изменении
const handleQuestionChange = (questionId: string, data: QuestionData) => {
  // Сохранение в localStorage
  TestLocalStorage.save(questionId, {
    question: data.question,
    answers: data.answerVariants,
    points: data.points,
    timeLimit: data.timeLimit,
    imageUrl: data.photoUrl
  }, data.type);
  
  // Обновление состояния
  setQuestions(prev => prev.map(q => 
    q.id === questionId ? { ...q, ...data } : q
  ));
  
  setHasUnsavedChanges(true);
};
```

---

## Публикация теста

### Процесс публикации:

```typescript
const publishTest = async () => {
  // 1. Валидация
  if (questions.length === 0) {
    showError('Добавьте хотя бы один вопрос');
    return;
  }
  
  // 2. Создание/обновление теста в БД
  let savedTestId = test.id;
  
  if (isTempId(test.id)) {
    // Создание нового теста
    const response = await fetch('/api/teacher/tests', {
      method: 'POST',
      body: JSON.stringify({
        name: test.name,
        description: test.description,
        teacherId: teacherId,
        language: test.language
      })
    });
    
    const result = await response.json();
    savedTestId = result.data.id;
  } else {
    // Обновление существующего
    await fetch(`/api/teacher/tests/${test.id}`, {
      method: 'PUT',
      body: JSON.stringify(test)
    });
  }
  
  // 3. Сохранение вопросов в БД
  for (const question of questions) {
    if (isTempId(question.id)) {
      // Создание нового вопроса
      await fetch(`/api/teacher/tests/${savedTestId}/questions?teacherId=${teacherId}`, {
        method: 'POST',
        body: JSON.stringify({
          question: question.question,
          answerVariants: question.answerVariants,
          photoUrl: question.photoUrl,
          points: question.points,
          timeLimit: question.timeLimit,
          type: question.type,
          language: test.language
        })
      });
    } else {
      // Обновление существующего
      await fetch(`/api/teacher/tests/${savedTestId}/questions/${question.id}`, {
        method: 'PUT',
        body: JSON.stringify(question)
      });
    }
  }
  
  // 4. Очистка localStorage
  removeDraftTest(test.id);
  removeTestStatus(test.id);
  TestLocalStorage.removeTestQuestions(test.id);
  
  // 5. Обновление статуса
  setTestStatus(savedTestId, 'published');
};
```

### Валидация перед публикацией:

```typescript
// Проверка каждого вопроса
for (const question of questions) {
  // Минимум 2 варианта ответа
  if (question.answerVariants.filter(v => v.value.trim()).length < 2) {
    return false;
  }
  
  // Хотя бы один правильный ответ
  if (!question.answerVariants.some(v => v.isCorrect)) {
    return false;
  }
  
  // Заполнен текст вопроса
  if (!question.question.trim() && !question.textRac.trim()) {
    return false;
  }
}
```

---

## Хранение данных

### localStorage структура:

```typescript
// Черновики тестов
localStorage.setItem('teacher_tests_draft', JSON.stringify({
  'temp-123': {
    id: 'temp-123',
    name: 'Тест',
    description: 'Описание',
    language: 'ru',
    status: 'draft',
    createdAt: '2025-01-16T10:00:00Z',
    updatedAt: '2025-01-16T10:00:00Z',
    teacherId: 'teacher_123'
  }
}));

// Статусы тестов
localStorage.setItem('test_statuses', JSON.stringify({
  'temp-123': 'draft',
  'test_456': 'published'
}));

// Вопросы теста
localStorage.setItem('testQuestions_temp-123', JSON.stringify([
  { id: 'q1', type: 'standard' },
  { id: 'q2', type: 'analogy' }
]));

// Данные вопроса
localStorage.setItem('TestStandard_q1', JSON.stringify({
  question: 'Текст вопроса',
  answers: [
    { id: 'a1', value: 'Вариант 1', isCorrect: true },
    { id: 'a2', value: 'Вариант 2', isCorrect: false }
  ],
  points: 1,
  timeLimit: 60,
  imageUrl: 'https://...',
  lastModified: 1234567890,
  version: 1
}));
```

### БД структура:

```sql
-- Таблица тестов
teacher_tests (
  id, name, description, created_by, language, created_at, updated_at
)

-- Таблица вопросов
questions (
  id, question, correct_variants_id, photo_url, 
  type_from, type_question, source_id, points, 
  language, time_limit, explanation_ai
)

-- Таблица вариантов ответов
answer_variants (
  id, question_id, value
)
```

---

## API эндпоинты

### Тесты

**GET** `/api/teacher/tests?teacherId={id}`
```json
{
  "success": true,
  "data": [
    {
      "id": "test_123",
      "name": "Тест",
      "description": "Описание",
      "questionsCount": 10,
      "completionsCount": 5,
      "createdAt": "2025-01-16T10:00:00Z",
      "updatedAt": "2025-01-16T10:00:00Z",
      "language": "ru"
    }
  ]
}
```

**POST** `/api/teacher/tests`
```json
{
  "name": "Название",
  "description": "Описание",
  "teacherId": "teacher_123",
  "language": "ru"
}
```

**PUT** `/api/teacher/tests/{id}`
```json
{
  "name": "Обновленное название",
  "description": "Обновленное описание"
}
```

**DELETE** `/api/teacher/tests/{id}`
```json
{
  "success": true,
  "message": "Тест удален"
}
```

### Вопросы

**GET** `/api/teacher/tests/{id}/questions`
```json
{
  "success": true,
  "data": [
    {
      "id": "q_123",
      "question": "Текст вопроса",
      "answerVariants": [
        { "id": "a1", "value": "Вариант 1", "isCorrect": true },
        { "id": "a2", "value": "Вариант 2", "isCorrect": false }
      ],
      "photoUrl": "https://...",
      "points": 1,
      "timeLimit": 60,
      "type": "standard",
      "language": "ru"
    }
  ]
}
```

**POST** `/api/teacher/tests/{id}/questions?teacherId={teacherId}`
```json
{
  "question": "Текст вопроса",
  "answerVariants": [
    { "value": "Вариант 1", "isCorrect": true },
    { "value": "Вариант 2", "isCorrect": false }
  ],
  "photoUrl": "https://...",
  "points": 1,
  "timeLimit": 60,
  "type": "standard",
  "language": "ru"
}
```

**PUT** `/api/teacher/tests/{id}/questions/{questionId}`
```json
{
  "question": "Обновленный текст",
  "answerVariants": [...],
  "points": 2
}
```

**DELETE** `/api/teacher/tests/{id}/questions/{questionId}`
```json
{
  "success": true,
  "message": "Вопрос удален"
}
```

---

## Структура БД

### Таблица `teacher_tests`:

```prisma
model Teacher_tests {
  id          String   @id @default(cuid())
  name        String
  description String?
  created_by  String
  language    UserLanguage // 'ru' | 'kg'
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@map("teacher_tests")
}
```

### Таблица `questions`:

```prisma
model Questions {
  id                  String           @id @default(cuid())
  question            String
  correct_variants_id String           // ID правильных ответов через запятую
  photo_url           String?
  type_from           QuestionTypeFrom // 'from_teacher'
  type_question       QuestionType     // 'standard' | 'analogy' | 'grammar' | 'math1' | 'math2' | 'rac'
  source_id           String           // ID теста
  points               Int              @default(1)
  language             UserLanguage
  time_limit           Int              @default(60)
  explanation_ai       String?
  created_at           DateTime         @default(now())
  updated_at           DateTime         @updatedAt

  answer_variants Answer_variants[]

  @@map("questions")
}
```

### Таблица `answer_variants`:

```prisma
model Answer_variants {
  id          String   @id @default(cuid())
  question_id String
  value       String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  question Questions @relation(fields: [question_id], references: [id], onDelete: Cascade)

  @@map("answer_variants")
}
```

---

## Утилиты

### Генерация временных ID:

```typescript
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith('temp-');
}
```

### Работа с localStorage:

```typescript
// Сохранение черновика
saveDraftTest(draftTest);

// Получение черновика
const draft = getDraftTest(testId);

// Удаление черновика
removeDraftTest(testId);

// Сохранение вопроса
TestLocalStorage.save(questionId, questionData, questionType);

// Загрузка вопроса
const question = TestLocalStorage.load(questionId, questionType);

// Получение всех вопросов теста
const questions = TestLocalStorage.getTestQuestions(testId);

// Удаление вопроса
TestLocalStorage.remove(questionId, questionType);
```

### Статусы тестов:

```typescript
// Установка статуса
setTestStatus(testId, 'draft' | 'published');

// Получение статуса
const status = getTestStatus(testId);

// Удаление статуса
removeTestStatus(testId);
```

---

## Компоненты

### CreateTest
- Список тестов
- Поиск и фильтрация
- Создание нового теста
- Редактирование/удаление

### TestEditorPage
- Редактор теста
- Добавление/редактирование вопросов
- Предпросмотр
- Публикация

### QuestionEditor
- Редактор вопроса
- Поддержка разных типов
- Загрузка изображений
- Формулы LaTeX

### TestToolbar
- Форматирование текста
- Вставка изображений
- AI объяснения

---

## Особенности реализации

### 1. Гибридное хранение:
- **Черновики** → localStorage (быстро, офлайн)
- **Опубликованные** → БД (постоянное хранение)

### 2. Временные ID:
- Генерация на клиенте
- Замена на реальные при публикации

### 3. Автосохранение:
- Сохранение в localStorage при изменении
- Предупреждение о несохраненных изменениях

### 4. Валидация:
- На клиенте перед публикацией
- На сервере при сохранении

### 5. Типы вопросов:
- Разные UI компоненты
- Единая структура данных
- Маппинг типов при сохранении

---

## Рекомендации

### 1. Производительность:
- Кэширование подсчета вопросов
- Ленивая загрузка вопросов
- Оптимизация localStorage операций

### 2. Безопасность:
- Валидация на сервере
- Проверка прав доступа
- Санитизация данных

### 3. UX:
- Автосохранение
- Индикаторы загрузки
- Подтверждение удаления
- Предупреждение о несохраненных изменениях

---

## Заключение

Система тестов использует гибридный подход:
- **localStorage** для черновиков (быстро, офлайн)
- **БД** для опубликованных тестов (постоянное хранение)

Поддерживает 6 типов вопросов с разными UI и единой структурой данных.

**Дата создания:** 2025-01-16  
**Версия:** 1.0

