# Реализация "Улучшить текст с помощью AI" и AI функций

Подробное описание реализации функции улучшения текста с помощью AI и всех AI функций в проекте.

---

## Что делает "Улучшить текст с помощью AI"

### Основная функция

"Улучшить текст с помощью AI" - это функция, которая позволяет улучшить выделенный текст в поле вопроса или ответа, делая его:
- Более грамматически правильным
- Более стилистически улучшенным
- Более понятным и читаемым
- Соответствующим языку курса (киргизский или русский)

### Где используется

- **Поле вопроса** в тестовых блоках
- **Поля ответов** в тестовых блоках
- **Поле объяснения** в модальном окне вопроса

### Как работает

1. Пользователь выделяет текст в поле
2. Нажимает кнопку "Улучшить текст" (волшебная палочка ✨)
3. AI улучшает выделенный текст
4. Улучшенный текст заменяет выделенный текст
5. Сохраняются обе версии (оригинал и улучшенный) для переключения

---

## Полный цикл работы

### 1. Выделение текста

Пользователь выделяет текст в активном поле (вопрос или ответ):

```typescript
const selection = window.getSelection();
const selectedText = selection?.toString().trim();
```

**Проверки:**
- Текст должен быть выделен
- Текст не должен быть пустым
- Должно быть активное поле

### 2. Нажатие кнопки "Улучшить текст"

Кнопка находится в `TestToolbar` (плавающая панель инструментов):

```tsx
<button
  onClick={onMagicWand}
  className="p-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
  data-tooltip="Улучшить выделенный текст с помощью AI"
>
  <PiSparkle className="h-5 w-5 text-gray-400 group-hover:text-purple-400" />
</button>
```

### 3. Обработка запроса

**В LessonTestsPage:**

```typescript
const handleMagicWand = async () => {
  // 1. Получаем активный блок
  const currentBlockId = activeBlockId.current;
  if (!currentBlockId) {
    alert('Выберите поле для улучшения');
    return;
  }

  // 2. Получаем форматтеры активного блока
  const formatters = formattersRefs.current.get(currentBlockId);
  if (!formatters) {
    alert('Блок не найден');
    return;
  }

  // 3. Получаем выделенный текст
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();
  
  if (!selectedText || selectedText.length === 0) {
    alert('Выделите текст для улучшения');
    return;
  }

  // 4. Получаем текущее значение активного поля
  const currentValue = formatters.getActiveFieldValue();
  
  // 5. Вызываем метод improveText
  if (formatters.improveText) {
    await formatters.improveText(selectedText, currentValue, courseLanguage);
  }
  
  // 6. Снимаем выделение
  selection?.removeAllRanges();
};
```

### 4. Улучшение текста в блоке

**В TestRACBlock (и других блоках):**

```typescript
const improveText = useCallback(async (
  selectedText: string, 
  currentValue: string, 
  language: 'kg' | 'ru'
) => {
  setIsImprovingText(true); // Показываем анимацию загрузки
  
  const fieldType = activeField === 'question' ? 'question' : 'answer';
  const fieldId = activeField || '';
  const versionKey = `${fieldType}_${fieldId}`;
  
  try {
    // 1. Вызываем AI для улучшения текста
    const improvedText = await improveTextAI(selectedText, language);
    
    // 2. Заменяем выделенный текст на улучшенный
    const newValue = currentValue.replace(selectedText, improvedText);
    
    // 3. Обновляем значение поля
    setActiveFieldValue(newValue);
    
    // 4. Сохраняем обе версии для переключения
    setTextVersions(prev => ({
      ...prev,
      [versionKey]: {
        original: currentValue,
        improved: newValue,
        isShowingImproved: true,
      }
    }));
    
    // 5. Сохраняем в историю localStorage
    if (blockId) {
      addToImprovementHistory({
        blockId,
        fieldType,
        fieldId,
        originalText: selectedText,
        improvedText,
        language,
      });
    }
  } catch (error) {
    console.error('Ошибка улучшения текста:', error);
    throw error;
  } finally {
    setIsImprovingText(false); // Скрываем анимацию загрузки
  }
}, [setActiveFieldValue, improveTextAI, activeField, blockId]);
```

### 5. API запрос

**Хук useAI:**

```typescript
const improveText = async (text: string, courseLanguage: 'kg' | 'ru'): Promise<string> => {
  setIsLoading(true);
  setError(null);

  const response = await apiRequest('/api/ai/improve-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      courseLanguage
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка при улучшении текста');
  }

  const data = await response.json();
  return data.improvedText;
};
```

### 6. API Endpoint

**POST /api/ai/improve-text:**

```typescript
export async function POST(request: NextRequest) {
  // 1. Проверка авторизации
  const user = await auth(request);
  if (!user) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
  }

  // 2. Получение данных
  const body = await request.json();
  const { text, courseLanguage } = body;

  // 3. Валидация
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 });
  }

  if (!courseLanguage || !['kg', 'ru'].includes(courseLanguage)) {
    return NextResponse.json({ error: 'Некорректный язык курса' }, { status: 400 });
  }

  // 4. Ограничение длины (максимум 5000 символов)
  if (text.length > 5000) {
    return NextResponse.json(
      { error: 'Текст слишком длинный (максимум 5000 символов)' },
      { status: 400 }
    );
  }

  // 5. Вызов AI сервиса
  const improvedText = await AIService.improveText(
    text.trim(),
    courseLanguage as 'kg' | 'ru'
  );

  // 6. Возврат результата
  return NextResponse.json({
    success: true,
    improvedText
  });
}
```

### 7. AI Service

**AIService.improveText:**

```typescript
static async improveText(
  text: string,
  courseLanguage: 'kg' | 'ru'
): Promise<string> {
  // 1. Получение API ключа OpenAI
  const apiKey = await this.getOpenAIApiKey();
  
  // 2. Получение промпта из базы данных
  const systemPrompt = await this.getPrompt('improve_text', courseLanguage);
  
  // 3. Получение конфигурации моделей
  const config = await this.getAIModelsConfig();
  const model = config.improveText; // По умолчанию: 'gpt-4o-mini'
  
  // 4. Запрос к OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt // Промпт из базы данных
        },
        {
          role: 'user',
          content: text // Выделенный текст пользователя
        }
      ]
    })
  });

  // 5. Обработка ответа
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Некорректный ответ от OpenAI API');
  }

  // 6. Возврат улучшенного текста
  return data.choices[0].message.content.trim();
}
```

---

## Сохранение версий текста

### Структура версий

После улучшения текста сохраняются две версии:

```typescript
interface TextVersion {
  original: string;      // Оригинальный текст (до улучшения)
  improved: string;       // Улучшенный текст (после улучшения)
  isShowingImproved: boolean; // Какая версия сейчас отображается
}
```

**Ключ версии:**
```typescript
const versionKey = `${fieldType}_${fieldId}`;
// Пример: "question_question" или "answer_1"
```

### Переключение между версиями

После улучшения текста появляется кнопка для переключения:

```tsx
{hasVersions('question', 'question') && (
  <button
    onClick={() => toggleTextVersion('question', 'question')}
    className="bg-purple-600/20 hover:bg-purple-600/30"
  >
    {isShowingImproved('question', 'question') 
      ? 'Показать оригинал' 
      : 'Показать улучшенный'}
  </button>
)}
```

**Функция переключения:**

```typescript
const toggleTextVersion = (fieldType: 'question' | 'answer', fieldId: string) => {
  const versionKey = `${fieldType}_${fieldId}`;
  const version = textVersions[versionKey];
  
  if (!version) return;
  
  const newIsShowingImproved = !version.isShowingImproved;
  const valueToSet = newIsShowingImproved ? version.improved : version.original;
  
  // Обновляем значение поля
  if (fieldType === 'question') {
    setQuestion(valueToSet);
  } else {
    setAnswers(prev => prev.map(a => 
      a.id === fieldId ? { ...a, value: valueToSet } : a
    ));
  }
  
  // Обновляем состояние версий
  setTextVersions(prev => ({
    ...prev,
    [versionKey]: {
      ...version,
      isShowingImproved: newIsShowingImproved,
    }
  }));
};
```

---

## История улучшений

### Сохранение в localStorage

История улучшений сохраняется в localStorage для возможности восстановления:

```typescript
interface ImprovementHistoryItem {
  id: string;
  timestamp: number;
  blockId: string;
  fieldType: 'question' | 'answer';
  fieldId: string;
  originalText: string;
  improvedText: string;
  language: 'kg' | 'ru';
}
```

**Добавление в историю:**

```typescript
export function addToImprovementHistory(
  item: Omit<ImprovementHistoryItem, 'id' | 'timestamp'>
): ImprovementHistoryItem {
  const newItem: ImprovementHistoryItem = {
    ...item,
    id: `improvement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  let history = getImprovementHistory();
  history.unshift(newItem); // Добавляем в начало
  
  // Ограничиваем количество записей (максимум 50)
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(0, MAX_HISTORY_ITEMS);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return newItem;
}
```

### Восстановление истории

При монтировании компонента история загружается из localStorage:

```typescript
useEffect(() => {
  if (!blockId) return;
  
  const history = getBlockHistory(blockId);
  if (history.length === 0) return;
  
  // Восстанавливаем textVersions из истории
  const restoredVersions: typeof textVersions = {};
  
  history.forEach(item => {
    const versionKey = `${item.fieldType}_${item.fieldId}`;
    
    // Получаем текущее значение поля
    let currentValue = '';
    if (item.fieldType === 'question') {
      currentValue = question;
    } else {
      const answer = answers.find(a => a.id === item.fieldId);
      currentValue = answer?.value || '';
    }
    
    // Проверяем, что текущее значение соответствует одной из версий
    const matchesOriginal = currentValue.includes(item.originalText);
    const matchesImproved = currentValue.includes(item.improvedText);
    
    if (matchesOriginal || matchesImproved) {
      const original = matchesOriginal ? currentValue : currentValue.replace(item.improvedText, item.originalText);
      const improved = matchesImproved ? currentValue : currentValue.replace(item.originalText, item.improvedText);
      
      restoredVersions[versionKey] = {
        original,
        improved,
        isShowingImproved: matchesImproved,
      };
    }
  });
  
  if (Object.keys(restoredVersions).length > 0) {
    setTextVersions(restoredVersions);
  }
}, [blockId]);
```

---

## Все AI функции в проекте

### 1. Улучшить текст (improveText)

**Назначение:** Улучшение выделенного текста

**Использование:**
- Поле вопроса в тестах
- Поля ответов в тестах
- Поле объяснения

**API:** `POST /api/ai/improve-text`

**Промпт:** `improve_text` (из базы данных)

**Модель:** `gpt-4o-mini` (по умолчанию)

---

### 2. Улучшить лекцию (improveLecture)

**Назначение:** Улучшение всего текста лекции

**Использование:**
- Редактор лекций (`LectureEditor`)

**API:** `POST /api/ai/improve-lecture`

**Промпт:** `improve_lecture` (из базы данных)

**Модель:** `gpt-4o-mini` (по умолчанию)

**Особенности:**
- Улучшает весь текст лекции целиком
- Сохраняет структуру Markdown
- Улучшает стиль и грамматику

---

### 3. Объяснить вопрос (explainQuestion)

**Назначение:** Генерация объяснения к тестовому вопросу

**Использование:**
- Кнопка "Получить объяснение от AI" в тестовых блоках

**API:** `POST /api/ai/explain-question`

**Промпты:** 
- `explain_question_math1` (для типа M1)
- `explain_question_math2` (для типа M2)
- `explain_question_analogy` (для типа A)
- `explain_question_rac` (для типа Ч)
- `explain_question_grammar` (для типа Г)
- `explain_question_standard` (для типа C, по умолчанию)

**Модели:**
- `default`: `gpt-4o-mini` (для текстовых вопросов)
- `withImage`: `gpt-5-mini` (для вопросов с изображениями)

**Особенности:**
- Поддерживает разные типы тестов
- Может работать с изображениями (для math1, math2, standard)
- Формирует структурированное объяснение

---

### 4. Изображение в LaTeX (convertImageToLatex)

**Назначение:** Конвертация изображения математической формулы в LaTeX код

**Использование:**
- Кнопка "Image to LaTeX" в редакторах

**API:** `POST /api/ai/image-to-latex`

**Промпт:** `image_to_latex` (из базы данных)

**Модель:** `gpt-4o-mini` (по умолчанию)

**Особенности:**
- Принимает изображение в base64
- Возвращает LaTeX код формулы
- Вставляет код в активное поле

---

## Архитектура AI функций

### Хук useAI

Центральный хук для всех AI функций:

```typescript
export function useAI(): UseAIReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    improveLecture,
    convertImageToLatex,
    explainQuestion,
    improveText,
    isLoading,
    error
  };
}
```

**Преимущества:**
- Единая точка доступа к AI функциям
- Общее управление состоянием загрузки
- Обработка ошибок

### AIService

Сервисный класс для работы с OpenAI API:

```typescript
export class AIService {
  // Получение API ключа из базы данных
  private static async getOpenAIApiKey(): Promise<string>
  
  // Получение конфигурации моделей
  private static async getAIModelsConfig(): Promise<AIModelsConfig>
  
  // Получение промпта из базы данных
  private static async getPrompt(name: string, language: 'kg' | 'ru'): Promise<string>
  
  // AI функции
  static async improveLecture(...): Promise<string>
  static async convertImageToLatex(...): Promise<string>
  static async explainQuestion(...): Promise<string>
  static async improveText(...): Promise<string>
}
```

**Особенности:**
- Все методы статические
- Промпты загружаются из базы данных
- Модели настраиваются через конфигурацию
- Поддержка разных языков (kg, ru)

---

## Конфигурация моделей

### Хранение в базе данных

Конфигурация моделей хранится в таблице `Settings`:

```typescript
{
  key: 'OPENAI_API_MODELS',
  value: JSON.stringify({
    improveLecture: 'gpt-4o-mini',
    convertImageToLatex: 'gpt-4o-mini',
    explainQuestion: {
      default: 'gpt-4o-mini',
      withImage: 'gpt-5-mini'
    },
    improveText: 'gpt-4o-mini'
  })
}
```

### Дефолтные значения

Если конфигурация не найдена, используются дефолтные значения:

```typescript
{
  improveLecture: 'gpt-4o-mini',
  convertImageToLatex: 'gpt-4o-mini',
  explainQuestion: {
    default: 'gpt-4o-mini',
    withImage: 'gpt-5-mini'
  },
  improveText: 'gpt-4o-mini'
}
```

---

## Промпты

### Хранение в базе данных

Промпты хранятся в таблице `Prompts`:

```typescript
{
  name: 'improve_text',
  language: 'ru',
  value: 'Ты помощник для улучшения текста...'
}
```

### Поддерживаемые промпты

**Для улучшения текста:**
- `improve_text` (ru, kg)

**Для улучшения лекции:**
- `improve_lecture` (ru, kg)

**Для объяснения вопросов:**
- `explain_question_math1` (ru, kg)
- `explain_question_math2` (ru, kg)
- `explain_question_analogy` (ru, kg)
- `explain_question_rac` (ru, kg)
- `explain_question_grammar` (ru, kg)
- `explain_question_standard` (ru, kg)

**Для конвертации изображения:**
- `image_to_latex` (ru)

---

## Анимация загрузки

### Визуальная индикация

Во время улучшения текста показывается анимация:

```tsx
{isImprovingText ? (
  <div className="w-10 h-10 flex items-center justify-center">
    <div className="loader-circle"></div>
  </div>
) : (
  <TestAIExplainButton ... />
)}
```

**CSS анимация:**

```css
.loader-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: transparent;
  animation: loader-combined 2.3s linear infinite;
}

@keyframes loader-combined {
  0% {
    transform: rotate(90deg);
    box-shadow: /* фиолетовые тени */;
  }
  100% {
    transform: rotate(450deg);
    box-shadow: /* фиолетовые тени */;
  }
}
```

---

## Обработка ошибок

### Уровни обработки

**1. Уровень хука (useAI):**

```typescript
try {
  setIsLoading(true);
  setError(null);
  // ... запрос
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
  setError(errorMessage);
  throw err;
} finally {
  setIsLoading(false);
}
```

**2. Уровень API endpoint:**

```typescript
try {
  // ... обработка
} catch (error) {
  console.error('Ошибка API улучшения текста:', error);
  
  let errorMessage = 'Внутренняя ошибка сервера';
  let statusCode = 500;
  
  if (error instanceof Error) {
    errorMessage = error.message;
    
    if (error.message.includes('OpenAI API key')) {
      statusCode = 503; // Service Unavailable
    }
  }
  
  return NextResponse.json({ error: errorMessage }, { status: statusCode });
}
```

**3. Уровень компонента:**

```typescript
try {
  await formatters.improveText(selectedText, currentValue, courseLanguage);
} catch (error) {
  console.error('Ошибка при улучшении текста:', error);
  alert('Ошибка при улучшении текста');
}
```

---

## Ограничения

### Длина текста

- **Максимальная длина** для улучшения: 5000 символов
- Если текст длиннее, возвращается ошибка 400

### Количество записей истории

- **Максимум** 50 записей в истории улучшений
- Старые записи удаляются автоматически

### API ключ

- API ключ OpenAI должен быть настроен в базе данных
- Если ключ не найден, возвращается ошибка 503

---

## Примеры использования

### Пример 1: Улучшение текста вопроса

```typescript
// 1. Пользователь выделяет текст: "этот текст нужно улучшить"
// 2. Нажимает кнопку "Улучшить текст"
// 3. AI улучшает: "Этот текст необходимо улучшить"
// 4. Текст заменяется в поле
// 5. Появляется кнопка переключения версий
```

### Пример 2: Улучшение текста ответа

```typescript
// 1. Пользователь выделяет текст в поле ответа
// 2. Нажимает кнопку "Улучшить текст"
// 3. AI улучшает грамматику и стиль
// 4. Текст заменяется
// 5. Сохраняется в историю
```

### Пример 3: Переключение версий

```typescript
// 1. После улучшения показывается улучшенная версия
// 2. Пользователь нажимает "Показать оригинал"
// 3. Текст меняется на оригинальный
// 4. Пользователь может снова переключить на улучшенный
```

---

## Итоговая схема работы

```
Пользователь выделяет текст
         ↓
Нажимает кнопку "Улучшить текст"
         ↓
Проверка выделенного текста
         ↓
Получение активного поля
         ↓
Вызов improveText в блоке
         ↓
Показ анимации загрузки
         ↓
API запрос к /api/ai/improve-text
         ↓
AIService.improveText
         ↓
Запрос к OpenAI API
         ↓
Получение улучшенного текста
         ↓
Замена выделенного текста
         ↓
Сохранение версий (оригинал/улучшенный)
         ↓
Сохранение в историю localStorage
         ↓
Скрытие анимации загрузки
         ↓
Показ кнопки переключения версий
```

---

## Заключение

Функция "Улучшить текст с помощью AI" предоставляет:

- ✅ Улучшение грамматики и стиля текста
- ✅ Поддержку киргизского и русского языков
- ✅ Сохранение версий для переключения
- ✅ Историю улучшений в localStorage
- ✅ Визуальную индикацию загрузки
- ✅ Обработку ошибок на всех уровнях
- ✅ Интеграцию с OpenAI API
- ✅ Настраиваемые промпты и модели

Все AI функции работают через единый хук `useAI` и сервис `AIService`, обеспечивая консистентность и удобство использования.

