# Логика работы кнопок AI в редакторе урока

Подробное описание работы кнопок "AI" и "Улучшить выделенный текст с помощью AI" в разделе редактирования урока.

---

## 1. Кнопка "AI" в редакторе лекций (LectureEditor)

### Расположение
**Компонент**: `src/components/ui/LectureEditor.tsx`  
**Расположение**: Панель инструментов Markdown редактора (MDEditor)

### Визуальное представление
- **Иконка**: SVG с символом звездочки/искры (AI символ)
- **Позиция**: В панели инструментов редактора, между кнопками форматирования
- **Стиль**: Стандартная кнопка панели инструментов с hover эффектом

### Логика работы

#### 1.1. Инициализация и состояние

```typescript
const [showAiDropdown, setShowAiDropdown] = useState(false);
const [aiButtonPosition, setAiButtonPosition] = useState({ top: 0, left: 0 });
const aiDropdownRef = useRef<HTMLDivElement>(null);
```

**Состояния**:
- `showAiDropdown` - управляет видимостью выпадающего меню
- `aiButtonPosition` - хранит координаты для позиционирования меню
- `aiDropdownRef` - ссылка на DOM элемент выпадающего меню

#### 1.2. Обработчик клика на кнопку AI

**Код команды**:
```typescript
{
  name: 'ai',
  keyCommand: 'ai',
  buttonProps: { 'aria-label': 'AI Assistant', title: 'AI помощник' },
  icon: <svg>...</svg>,
  execute: () => {
    const newShowState = !showAiDropdown;
    setShowAiDropdown(newShowState);
    
    if (newShowState) {
      // Вычисляем позицию меню
      setTimeout(() => {
        const aiButton = document.querySelector('[aria-label="AI Assistant"]') as HTMLElement;
        
        if (aiButton) {
          const editorContainer = aiButton.closest('.w-md-editor') as HTMLElement;
          const mainContainer = aiButton.closest('[data-lecture-editor-container]') as HTMLElement;
          
          if (editorContainer && mainContainer) {
            const rect = aiButton.getBoundingClientRect();
            const containerRect = mainContainer.getBoundingClientRect();
            
            const menuWidth = 157;
            const menuHeight = 45;
            
            // Позиционирование меню сверху кнопки
            let top = (rect.top - containerRect.top) - menuHeight - 15;
            let left = rect.right - containerRect.left - menuWidth + 10;
            
            // Проверка границ
            if (top < 0) {
              top = -menuHeight - 10;
            }
            if (left < 0) {
              left = 10;
            }
            
            setAiButtonPosition({ top, left });
          }
        }
      }, 10);
    }
  }
}
```

**Алгоритм работы**:
1. При клике на кнопку AI переключается состояние `showAiDropdown`
2. Если меню открывается (`newShowState === true`):
   - Находится DOM элемент кнопки AI через `querySelector`
   - Определяются родительские контейнеры (редактор и главный контейнер)
   - Вычисляются координаты кнопки относительно контейнера
   - Рассчитывается позиция выпадающего меню (сверху кнопки с отступом 15px)
   - Проверяются границы экрана, чтобы меню не выходило за пределы
   - Устанавливается позиция через `setAiButtonPosition`

#### 1.3. Выпадающее меню AI

**Структура меню**:
```jsx
{showAiDropdown && (
  <div 
    ref={aiDropdownRef}
    className="absolute bg-[#151515] border border-[#404040] rounded-md shadow-lg z-[9999]"
    style={{
      top: `${aiButtonPosition.top}px`,
      left: `${aiButtonPosition.left}px`,
      minWidth: '140px',
      pointerEvents: 'auto'
    }}
  >
    {/* Треугольный указатель */}
    <div style={{ /* треугольник внизу */ }} />
    
    {/* Кнопка "Улучшить лекцию" */}
    <button onClick={() => {
      setShowImproveLectureModal(true);
      setShowAiDropdown(false);
    }}>
      Улучшить лекцию
    </button>
    
    {/* Кнопка "Картинка - LaTeX" */}
    <button onClick={() => {
      setShowImageLatexModal(true);
      setShowAiDropdown(false);
    }}>
      Картинка - LaTeX
    </button>
  </div>
)}
```

**Опции меню**:
1. **"Улучшить лекцию"** - открывает модальное окно для улучшения текста лекции
2. **"Картинка - LaTeX"** - открывает модальное окно для конвертации изображения в LaTeX код

#### 1.4. Закрытие меню при клике вне

```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (aiDropdownRef.current && !aiDropdownRef.current.contains(event.target as Node)) {
      setShowAiDropdown(false);
    }
  };

  if (showAiDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showAiDropdown]);
```

**Логика**: При клике вне выпадающего меню оно автоматически закрывается.

---

### 1.5. Модальное окно "Улучшить лекцию"

#### Инициализация
```typescript
const [showImproveLectureModal, setShowImproveLectureModal] = useState(false);
const [lectureInput, setLectureInput] = useState('');
const { improveLecture, isLoading: aiLoading, error: aiError } = useAI();
```

#### Обработчик улучшения
```typescript
const handleImproveLecture = async () => {
  if (!lectureInput.trim()) {
    alert(t('lectureEditor.alerts.enterLectureText'));
    return;
  }

  try {
    const improvedText = await improveLecture(lectureInput, courseLanguage);
    insertTextAtCursor(improvedText);
    setShowImproveLectureModal(false);
    setLectureInput('');
  } catch (error) {
    console.error('Ошибка улучшения лекции:', error);
    alert(t('lectureEditor.alerts.lectureImprovementError'));
  }
};
```

**Алгоритм**:
1. Проверяется, что введен текст (`lectureInput.trim()`)
2. Вызывается функция `improveLecture` из хука `useAI` с параметрами:
   - `lectureInput` - текст для улучшения
   - `courseLanguage` - язык курса ('kg' | 'ru')
3. Улучшенный текст вставляется в позицию курсора через `insertTextAtCursor`
4. Модальное окно закрывается, поле ввода очищается
5. При ошибке показывается alert

#### Функция вставки текста
```typescript
const insertTextAtCursor = (textToInsert: string) => {
  const textarea = textareaRef.current;
  if (!textarea) {
    onChange(value + textToInsert);
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  const newValue = value.substring(0, start) + textToInsert + value.substring(end);
  onChange(newValue);
  
  setTimeout(() => {
    const newCursorPosition = start + textToInsert.length;
    textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    textarea.focus();
  }, 0);
};
```

**Логика**:
- Получает текущую позицию курсора (`selectionStart`, `selectionEnd`)
- Вставляет новый текст между началом и концом выделения
- Устанавливает курсор после вставленного текста

#### API запрос (useAI хук)
```typescript
const improveLecture = async (input: string, courseLanguage: 'kg' | 'ru'): Promise<string> => {
  setIsLoading(true);
  setError(null);

  const response = await apiRequest('/api/ai/improve-lecture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, courseLanguage })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка при улучшении лекции');
  }

  const data = await response.json();
  return data.improvedLecture;
};
```

**Эндпоинт**: `POST /api/ai/improve-lecture`  
**Параметры**:
- `input` - текст для улучшения
- `courseLanguage` - язык курса

---

### 1.6. Модальное окно "Картинка - LaTeX"

#### Инициализация
```typescript
const [showImageLatexModal, setShowImageLatexModal] = useState(false);
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const { convertImageToLatex, isLoading: aiLoading, error: aiError } = useAI();
```

#### Обработчик выбора файла
```typescript
const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert(t('lectureEditor.alerts.selectImage'));
      return;
    }
    
    // Проверка размера (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('lectureEditor.alerts.imageSizeLimit'));
      return;
    }
    
    setSelectedImage(file);
  }
};
```

**Валидация**:
- Тип файла должен начинаться с `image/`
- Размер файла не должен превышать 5MB

#### Обработчик конвертации
```typescript
const handleImageToLatex = async () => {
  if (!selectedImage) {
    alert(t('lectureEditor.alerts.selectImage'));
    return;
  }

  try {
    const latexCode = await convertImageToLatex(selectedImage);
    insertTextAtCursor(latexCode);
    setShowImageLatexModal(false);
    setSelectedImage(null);
  } catch (error) {
    console.error('Ошибка конвертации изображения:', error);
    alert(t('lectureEditor.alerts.imageConversionError'));
  }
};
```

#### API запрос
```typescript
const convertImageToLatex = async (imageFile: File): Promise<string> => {
  setIsLoading(true);
  setError(null);

  // Конвертация в base64
  const base64 = await fileToBase64(imageFile);
  
  const response = await apiRequest('/api/ai/image-to-latex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64 })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка при конвертации изображения');
  }

  const data = await response.json();
  return data.latexCode;
};
```

**Эндпоинт**: `POST /api/ai/image-to-latex`  
**Параметры**:
- `imageBase64` - изображение в формате base64 (без префикса `data:image/...;base64,`)

---

## 2. Кнопка "Улучшить выделенный текст с помощью AI" в редакторе тестов

### Расположение
**Компонент**: `src/components/dashboard/TestToolbar.tsx`  
**Расположение**: Панель инструментов редактора тестов (справа, рядом с кнопкой превью)

### Визуальное представление
- **Иконка**: SVG с символом волшебной палочки (magic wand)
- **Цвет**: Фиолетовый (`text-purple-400`)
- **Позиция**: Справа в панели инструментов, перед кнопкой превью
- **Tooltip**: "Улучшить выделенный текст с помощью AI"

### Логика работы

#### 2.1. Инициализация

```typescript
// В TestToolbar.tsx
interface TestToolbarProps {
  onMagicWand?: () => void;  // Callback функция
  // ... другие пропсы
}

// Кнопка в панели инструментов
{onMagicWand && (
  <button
    type="button"
    onClick={onMagicWand}
    className="p-2.5 hover:bg-gray-800 rounded-lg transition-colors group relative"
    data-tooltip={t('tooltips.aiImproveText')}
  >
    <svg>...</svg> {/* Иконка волшебной палочки */}
  </button>
)}
```

#### 2.2. Обработчик в LessonTestsPage

```typescript
// В LessonTestsPage.tsx
const handleMagicWand = async () => {
  // 1. Получаем активный блок
  const currentBlockId = activeBlockId.current;
  if (!currentBlockId) {
    alert(t('testEditor.validation.selectFieldFirst'));
    return;
  }

  // 2. Получаем ссылку на форматтеры блока
  const formatters = formattersRefs.current.get(currentBlockId);
  if (!formatters) {
    alert(t('testEditor.errors.activeBlockNotFound'));
    return;
  }

  try {
    // 3. Получаем выделенный текст
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (!selectedText || selectedText.length === 0) {
      alert(t('testEditor.errors.selectTextToImprove'));
      return;
    }

    // 4. Проверяем наличие методов
    if (!formatters.getActiveFieldValue || !formatters.setActiveFieldValue) {
      alert(t('testEditor.errors.functionNotAvailable'));
      return;
    }

    // 5. Получаем текущее значение поля
    const currentValue = formatters.getActiveFieldValue();

    // 6. Вызываем метод улучшения
    if (formatters.improveText) {
      await formatters.improveText(selectedText, currentValue, courseLanguage);
    } else {
      alert(t('testEditor.errors.functionNotAvailable'));
    }
    
    // 7. Снимаем выделение
    selection?.removeAllRanges();
  } catch (error) {
    console.error('Ошибка при улучшении текста:', error);
    alert(t('testEditor.errors.improvementError'));
  }
};
```

**Алгоритм работы**:
1. **Проверка активного блока**: Убеждается, что есть активный блок теста
2. **Получение форматтеров**: Получает ссылку на методы форматирования активного блока
3. **Получение выделенного текста**: Использует `window.getSelection()` для получения выделенного пользователем текста
4. **Валидация**: Проверяет, что текст выделен и методы доступны
5. **Получение текущего значения**: Получает полный текст активного поля через `getActiveFieldValue()`
6. **Вызов улучшения**: Вызывает метод `improveText` блока с параметрами:
   - `selectedText` - выделенный текст
   - `currentValue` - полное значение поля
   - `courseLanguage` - язык курса
7. **Очистка**: Снимает выделение текста

#### 2.3. Реализация в блоках тестов (TestStandardBlock, TestMath1Block, и т.д.)

```typescript
// В TestStandardBlock.tsx (и других блоках)
const improveText = useCallback(async (
  selectedText: string, 
  currentValue: string, 
  language: 'kg' | 'ru'
) => {
  setIsImprovingText(true);
  
  const fieldType = activeField === 'question' ? 'question' : 'answer';
  const fieldId = activeField || '';
  const versionKey = `${fieldType}_${fieldId}`;
  
  try {
    // 1. Вызов AI API
    const improvedText = await improveTextAI(selectedText, language);
    
    // 2. Замена выделенного текста на улучшенный
    const newValue = currentValue.replace(selectedText, improvedText);
    
    // 3. Применение нового значения
    setActiveFieldValue(newValue);
    
    // 4. Сохранение версий для переключения
    setTextVersions(prev => ({
      ...prev,
      [versionKey]: {
        original: currentValue,
        improved: newValue,
        isShowingImproved: true,
      }
    }));
    
    // 5. Сохранение в историю localStorage
    if (blockId) {
      try {
        addToImprovementHistory({
          blockId,
          fieldType,
          fieldId,
          originalText: selectedText,
          improvedText,
          language,
        });
      } catch (historyError) {
        console.error('Ошибка сохранения в историю:', historyError);
      }
    }
    
  } catch (error) {
    console.error('Ошибка улучшения текста:', error);
    throw error;
  } finally {
    setIsImprovingText(false);
  }
}, [setActiveFieldValue, improveTextAI, activeField, blockId]);
```

**Алгоритм улучшения**:
1. **Установка состояния загрузки**: `setIsImprovingText(true)`
2. **Определение типа поля**: Вопрос или ответ
3. **Вызов AI**: `improveTextAI(selectedText, language)` - улучшает только выделенный текст
4. **Замена текста**: Заменяет выделенный текст на улучшенный в полном значении поля
5. **Применение**: Обновляет значение поля через `setActiveFieldValue`
6. **Сохранение версий**: Сохраняет оригинальную и улучшенную версии для возможности переключения
7. **История**: Сохраняет информацию об улучшении в localStorage
8. **Сброс состояния**: `setIsImprovingText(false)` в `finally`

#### 2.4. API запрос улучшения текста

```typescript
// В useAI.ts
const improveText = async (text: string, courseLanguage: 'kg' | 'ru'): Promise<string> => {
  setIsLoading(true);
  setError(null);

  const response = await apiRequest('/api/ai/improve-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, courseLanguage })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Ошибка при улучшении текста');
  }

  const data = await response.json();
  return data.improvedText;
};
```

**Эндпоинт**: `POST /api/ai/improve-text`  
**Параметры**:
- `text` - текст для улучшения (выделенный текст)
- `courseLanguage` - язык курса ('kg' | 'ru')

#### 2.5. Backend обработка (API Route)

```typescript
// В src/app/api/ai/improve-text/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const user = await auth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // 2. Парсинг тела запроса
    const body = await request.json();
    const { text, courseLanguage } = body;

    // 3. Валидация
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Текст обязателен' },
        { status: 400 }
      );
    }

    if (!courseLanguage || !['kg', 'ru'].includes(courseLanguage)) {
      return NextResponse.json(
        { error: 'Некорректный язык курса' },
        { status: 400 }
      );
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

  } catch (error) {
    console.error('Ошибка API улучшения текста:', error);
    
    let errorMessage = 'Внутренняя ошибка сервера';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('OpenAI API key')) {
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('промпты')) {
        statusCode = 503;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
```

**Валидация**:
- Проверка авторизации пользователя
- Проверка наличия и типа текста
- Проверка языка курса
- Ограничение длины текста (5000 символов)

---

## 3. Сохранение истории улучшений

### Структура истории

```typescript
interface ImprovementHistoryItem {
  blockId: string;
  fieldType: 'question' | 'answer';
  fieldId: string;
  originalText: string;
  improvedText: string;
  language: 'kg' | 'ru';
  timestamp?: number;
}
```

### Функция сохранения

```typescript
function addToImprovementHistory(item: ImprovementHistoryItem) {
  try {
    const key = `improvement_history_${item.blockId}`;
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    
    history.push({
      ...item,
      timestamp: Date.now()
    });
    
    // Ограничение истории (последние 50 улучшений)
    const limitedHistory = history.slice(-50);
    
    localStorage.setItem(key, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Ошибка сохранения истории:', error);
  }
}
```

**Особенности**:
- История сохраняется в localStorage
- Ключ: `improvement_history_{blockId}`
- Ограничение: последние 50 улучшений на блок
- Каждая запись содержит timestamp

---

## 4. Переключение версий текста

### Сохранение версий

```typescript
const [textVersions, setTextVersions] = useState<Record<string, {
  original: string;
  improved: string;
  isShowingImproved: boolean;
}>>({});
```

**Структура**:
- Ключ: `${fieldType}_${fieldId}` (например, `question_` или `answer_123`)
- Значение: объект с оригинальной и улучшенной версиями

### Функция переключения

```typescript
const toggleTextVersion = useCallback((
  fieldType: 'question' | 'answer', 
  fieldId: string
) => {
  const versionKey = `${fieldType}_${fieldId}`;
  const version = textVersions[versionKey];
  
  if (!version) return;
  
  const newIsShowingImproved = !version.isShowingImproved;
  const valueToSet = newIsShowingImproved ? version.improved : version.original;
  
  if (fieldType === 'question') {
    setQuestion(valueToSet);
  } else {
    setAnswers(prev => prev.map(a => 
      a.id === fieldId ? { ...a, value: valueToSet } : a
    ));
  }
  
  setTextVersions(prev => ({
    ...prev,
    [versionKey]: {
      ...version,
      isShowingImproved: newIsShowingImproved,
    }
  }));
}, [textVersions, answers]);
```

**Логика**:
- Переключает между оригинальной и улучшенной версией
- Обновляет значение поля (вопрос или ответ)
- Обновляет флаг `isShowingImproved`

---

## 5. Анимация загрузки

### Состояние загрузки

```typescript
const [isImprovingText, setIsImprovingText] = useState(false);
```

### Отображение анимации

```jsx
{isImprovingText && (
  <div className="loader-circle"></div>
  <style jsx>{`
    .loader-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: transparent;
      animation: loader-combined 2.3s linear infinite;
    }
    @keyframes loader-combined {
      /* Анимация вращения с фиолетовыми тенями */
    }
  `}</style>
)}
```

**Анимация**: Круглый индикатор с вращением и фиолетовыми тенями (см. `loading-animations.md`)

---

## 6. Сравнение двух кнопок

| Характеристика | Кнопка "AI" (Лекции) | Кнопка "Улучшить текст" (Тесты) |
|----------------|---------------------|----------------------------------|
| **Расположение** | Панель инструментов MDEditor | Панель инструментов TestToolbar |
| **Тип действия** | Выпадающее меню | Прямое действие |
| **Требования** | Нет (можно использовать в любой момент) | Требуется выделенный текст |
| **Область применения** | Вся лекция | Только выделенный фрагмент |
| **Результат** | Вставка в позицию курсора | Замена выделенного текста |
| **Сохранение версий** | Нет | Да (оригинал и улучшенная версия) |
| **История** | Нет | Да (localStorage) |

---

## 7. Поток данных

### Кнопка "AI" (Лекции)

```
Пользователь → Клик на кнопку AI
  ↓
Открытие выпадающего меню
  ↓
Выбор опции "Улучшить лекцию"
  ↓
Открытие модального окна
  ↓
Ввод текста → Клик "Отправить"
  ↓
POST /api/ai/improve-lecture
  ↓
Получение улучшенного текста
  ↓
Вставка в позицию курсора
```

### Кнопка "Улучшить текст" (Тесты)

```
Пользователь → Выделение текста
  ↓
Клик на кнопку "Улучшить текст"
  ↓
Проверка активного блока и выделенного текста
  ↓
Получение текущего значения поля
  ↓
POST /api/ai/improve-text
  ↓
Получение улучшенного текста
  ↓
Замена выделенного текста
  ↓
Сохранение версий и истории
```

---

## 8. Обработка ошибок

### Типы ошибок

1. **Ошибка валидации**:
   - Нет выделенного текста
   - Нет активного блока
   - Текст слишком длинный

2. **Ошибка API**:
   - Проблемы с авторизацией
   - Ошибка AI сервиса
   - Проблемы с сетью

3. **Ошибка сохранения**:
   - Ошибка localStorage
   - Ошибка обновления состояния

### Обработка

```typescript
try {
  // Выполнение улучшения
} catch (error) {
  console.error('Ошибка улучшения текста:', error);
  alert(t('testEditor.errors.improvementError'));
  // Или throw error для обработки выше
} finally {
  setIsImprovingText(false); // Всегда сбрасываем состояние
}
```

---

## 9. Зависимости

### Хуки
- `useAI()` - хук для работы с AI API
- `useTranslation()` - хук для переводов

### API Endpoints
- `POST /api/ai/improve-lecture` - улучшение лекции
- `POST /api/ai/improve-text` - улучшение выделенного текста
- `POST /api/ai/image-to-latex` - конвертация изображения в LaTeX

### Компоненты
- `LectureEditor` - редактор лекций
- `TestToolbar` - панель инструментов тестов
- `TestStandardBlock`, `TestMath1Block`, и т.д. - блоки тестов

---

## 10. Рекомендации по использованию

### Для кнопки "AI" (Лекции)
1. Используйте для генерации или улучшения больших фрагментов текста
2. Можно вводить тему лекции, AI сгенерирует полный текст
3. Результат вставляется в позицию курсора

### Для кнопки "Улучшить текст" (Тесты)
1. Выделите конкретный фрагмент текста перед использованием
2. Улучшается только выделенный текст, остальной текст остается без изменений
3. Можно переключаться между оригинальной и улучшенной версией
4. История улучшений сохраняется для отслеживания изменений

---

## 11. Технические детали

### Ограничения
- Максимальная длина текста для улучшения: **5000 символов**
- Максимальный размер изображения: **5MB**
- История улучшений: **50 последних записей** на блок

### Производительность
- Асинхронные запросы с индикацией загрузки
- Оптимистичное обновление UI
- Кэширование не используется (каждый запрос идет к API)

### Безопасность
- Проверка авторизации на backend
- Валидация входных данных
- Ограничение размера запросов

