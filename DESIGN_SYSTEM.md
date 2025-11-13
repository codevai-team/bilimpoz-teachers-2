# Design System и Стиль Bilimpoz Admin

> **Документ для разработки**: Этот файл содержит полное описание дизайн-системы, стилей и архитектуры интерфейса административной панели Bilimpoz. Используйте его как эталон для создания идентичных интерфейсов для других сервисов (например, для преподавателей).

---

## 📋 Содержание

1. [Цветовая палитра](#цветовая-палитра)
2. [Типографика](#типографика)
3. [Компоненты](#компоненты)
4. [Структура макета](#структура-макета)
5. [Интерактивность и анимации](#интерактивность-и-анимации)
6. [Адаптивность](#адаптивность)
7. [Паттерны страниц](#паттерны-страниц)

---

## 🎨 Цветовая палитра

### Основные цвета

```css
/* Фоновые цвета */
--background: #0b0b0b           /* Основной фон приложения - очень темный черный */
--card-background: #151515      /* Фон карточек и контейнеров - темно-серый */
--secondary-bg: #242424         /* Вторичный фон для полей ввода и элементов */
--hover-bg: #363636             /* Фон при наведении */
--hover-light: #1a1a1a          /* Легкий ховер эффект */
--hover-medium: #2a2a2a         /* Средний ховер эффект */

/* Текстовые цвета */
--foreground: #ffffff           /* Основной текст - белый */
--text-gray-300: #d1d5db        /* Светло-серый текст */
--text-gray-400: #9ca3af        /* Серый текст для вторичной информации */
--text-gray-500: #6b7280        /* Темно-серый текст */

/* Акцентные цвета */
--accent-white: #ffffff         /* Белый - основной акцент для кнопок и активных элементов */
--accent-red: #ef4444           /* Красный для удаления и ошибок */
--accent-red-hover: #dc2626
--accent-yellow: #eab308        /* Желтый для предупреждений */
--accent-yellow-hover: #ca8a04
--accent-green: #22c55e         /* Зеленый для успеха */
--accent-blue: #3b82f6          /* Синий для информации */

/* Границы */
--border-gray: #4a5565          /* Граница для полей ввода */
--border-gray-light: #374151    /* Светлая граница */
--border-gray-700: rgba(55, 65, 81, 0.5) /* Полупрозрачная граница */
```

### Принципы использования цветов

1. **Контрастность**: Всегда используйте высокий контраст между фоном и текстом (белый на темном)
2. **Иерархия**: 
   - `#ffffff` для основного текста
   - `#9ca3af` для вторичного текста
   - `#6b7280` для менее важной информации
3. **Акценты**: Белый цвет используется для главных действий, красный для опасных действий
4. **Слои**: Чем выше элемент в иерархии, тем светлее фон:
   - Основной фон: `#0b0b0b`
   - Карточки: `#151515`
   - Модальные окна/поля ввода: `#242424`

---

## ✍️ Типографика

### Шрифты

```javascript
// Основной шрифт
font-family: 'Geist Sans', Arial, Helvetica, sans-serif;

// Моноширинный шрифт (для кода)
font-family: 'Geist Mono', monospace;
```

**Установка шрифтов:**
```bash
npm install geist
```

**Импорт в layout:**
```typescript
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
```

### Размеры текста

```css
/* Заголовки */
h1: text-2xl (24px) font-bold         /* Заголовки страниц */
h2: text-xl (20px) font-bold          /* Заголовки секций */
h3: text-lg (18px) font-semibold      /* Подзаголовки */

/* Основной текст */
text-base (16px)                      /* Основной размер */
text-sm (14px)                        /* Вторичный текст, метки */
text-xs (12px)                        /* Мелкий текст, подсказки */

/* Крупный текст */
text-3xl (30px)                       /* Для больших чисел в статистике */
text-4xl (36px)                       /* Для очень крупных показателей */
```

### Начертания

```css
font-normal      /* 400 - обычный текст */
font-medium      /* 500 - подчеркнутый текст */
font-semibold    /* 600 - полужирный для важных элементов */
font-bold        /* 700 - жирный для заголовков */
```

---

## 🧩 Компоненты

### 1. Кнопки (Button)

**Путь:** `src/components/ui/Button.tsx`

#### Варианты (variants):

**Primary** - основная кнопка (белая):
```css
bg-white text-black font-semibold
hover:bg-gray-100 hover:scale-[1.02]
active:scale-[0.98]
border border-white
shadow-lg hover:shadow-xl
```

**Secondary** - вторичная кнопка (серая):
```css
bg-[#242424] text-white font-semibold
hover:bg-[#2a2a2a] hover:scale-[1.02]
active:scale-[0.98]
border border-gray-700/50
shadow-md hover:shadow-lg
```

**Outline** - контурная кнопка:
```css
bg-transparent text-white
hover:bg-white hover:text-black
border border-white
```

**Danger** - опасное действие (красная):
```css
bg-red-600 text-white font-semibold
hover:bg-red-700 hover:scale-[1.02]
active:scale-[0.98]
border border-red-600
shadow-lg hover:shadow-xl
```

**Warning** - предупреждение (желтая):
```css
bg-yellow-600 text-white font-semibold
hover:bg-yellow-700 hover:scale-[1.02]
active:scale-[0.98]
border border-yellow-600
shadow-lg hover:shadow-xl
```

#### Размеры (sizes):
- `sm`: `px-3 py-1.5 text-sm` - маленькая кнопка
- `md`: `px-5 py-2 text-base` - средняя кнопка (по умолчанию)
- `lg`: `px-8 py-3 text-lg` - большая кнопка

#### Особенности:
- Плавная анимация при наведении (scale transform)
- Анимация нажатия (active state)
- Поддержка состояния загрузки (isLoading) со спиннером
- Поддержка подсказок (tooltip) для disabled кнопок
- Автоматическое затемнение при disabled

**Пример использования:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Создать
</Button>

<Button variant="danger" size="sm" isLoading={isDeleting}>
  Удалить
</Button>
```

---

### 2. Выпадающий список (Select)

**Путь:** `src/components/ui/Select.tsx`

#### Стиль:
```css
/* Основной контейнер */
bg-[#242424] text-white border-0 rounded-lg
focus:outline-none focus:ring-2 focus:ring-white/20

/* Выпадающее меню */
bg-[#1a1a1a] border border-gray-700/50 rounded-lg
max-height: 300px overflow-y-auto
```

#### Особенности:
- Кастомный дизайн (не native select)
- Автоматическое позиционирование (вверх/вниз) в зависимости от места на экране
- Иконка стрелки (ChevronDown) справа
- Подсветка выбранного элемента
- Плавные переходы (transition-all)
- Закрывается при клике вне области (click outside)

**Структура опции:**
```typescript
interface SelectOption {
  value: string;
  label: string;
}
```

**Пример использования:**
```tsx
<Select
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  options={[
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'inactive', label: 'Неактивные' }
  ]}
  placeholder="Выберите опцию"
/>
```

---

### 3. Уведомления (Toast)

**Путь:** `src/components/ui/Toast.tsx`

#### Типы уведомлений:
- `success` - зеленая иконка, успешное действие
- `error` - красная иконка, ошибка
- `warning` - желтая иконка, предупреждение
- `info` - синяя иконка, информация

#### Стиль:
```css
/* Контейнер toast */
bg-[#1a1a1a] border border-gray-700 rounded-2xl
shadow-2xl backdrop-blur-sm
min-width: 320px max-width: 500px

/* Позиционирование */
position: fixed top-4 right-4
z-index: 9999
```

#### Особенности:
- Автоматическое исчезновение через 5 секунд (настраивается)
- Анимация появления и исчезновения (slide + fade)
- Прогресс-бар внизу показывает оставшееся время
- Поддержка кастомного контента (customContent)
- Поддержка кнопок действий (actionLabel, onAction)
- Возможность закрыть вручную (кнопка X)
- Стек уведомлений (несколько одновременно)

**Пример использования:**
```tsx
const { showToast } = useToast();

// Простое уведомление
showToast({
  type: 'success',
  title: 'Успешно',
  message: 'Данные сохранены'
});

// С кастомным временем
showToast({
  type: 'error',
  title: 'Ошибка',
  message: 'Не удалось загрузить данные',
  duration: 10000 // 10 секунд
});

// С кнопкой действия
showToast({
  type: 'warning',
  title: 'Предупреждение',
  message: 'Изменения будут потеряны',
  actionLabel: 'Отменить',
  onAction: () => console.log('Отменено')
});
```

---

### 4. Модальные окна

**Примеры:** `CreateSubscriptionModal.tsx`, `EditSubscriptionModal.tsx`, `UserDetailsModal.tsx`

#### Структура:

**Оверлей (затемнение):**
```css
fixed inset-0 bg-black/50 backdrop-blur-sm z-50
```

**Контейнер модального окна:**
```css
bg-[#151515] rounded-2xl shadow-2xl
max-width: 800px (или другое значение)
max-height: 90vh overflow-y-auto
```

**Заголовок:**
```css
flex items-center justify-between p-6 border-b border-gray-700
text-xl font-bold text-white
```

**Контент:**
```css
p-6 space-y-4
```

**Футер (кнопки):**
```css
flex justify-end gap-3 p-6 border-t border-gray-700
```

#### Особенности:
- Анимация появления (fade + scale)
- Закрывается при клике на оверлей
- Закрывается по Escape
- Фиксированное позиционирование по центру экрана
- Прокрутка контента, если не помещается
- Кастомный скроллбар (тонкий, в стиле приложения)

**Структура кода:**
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-[#151515] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Заголовок</h2>
        <button onClick={onClose}>
          <Icons.X className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      
      {/* Контент */}
      <div className="p-6 space-y-4">
        {/* Содержимое модального окна */}
      </div>
      
      {/* Футер */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button variant="primary" onClick={handleSubmit}>Сохранить</Button>
      </div>
    </div>
  </div>
)}
```

---

### 5. Поля ввода (Input, Textarea)

#### Input (текстовое поле):
```css
w-full px-3 py-2 border rounded-lg
bg-[#151515] text-white placeholder-gray-400
border-[#4A5565] /* обычное состояние */
border-red-500   /* при ошибке */
focus:outline-none focus:ring-2 focus:ring-white/20
text-sm
```

#### Textarea (многострочное поле):
```css
w-full px-3 py-2 border rounded-lg
bg-[#151515] text-white placeholder-gray-400
border-[#4A5565]
focus:outline-none focus:ring-2 focus:ring-white/20
resize-none
rows={4} /* стандартное количество строк */
text-sm
```

#### Особенности:
- Красная граница при ошибках валидации
- Счетчик символов для полей с `maxLength`
- Placeholder в сером цвете (`#9ca3af`)
- Автофокус на первом поле (где нужно)
- Disabled состояние с затемнением

**Пример с меткой и ошибкой:**
```tsx
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Название *
  </label>
  <input
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    maxLength={100}
    className={`w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 ${
      errors.name ? 'border-red-500' : 'border-[#4A5565]'
    }`}
    style={{ backgroundColor: '#151515' }}
    placeholder="Введите название"
  />
  {errors.name && (
    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
  )}
  {maxLength && (
    <p className="text-gray-400 text-xs mt-1">
      {value.length}/{maxLength}
    </p>
  )}
</div>
```

---

### 6. Чекбоксы

```css
/* Контейнер */
flex items-center gap-2 cursor-pointer

/* Чекбокс */
w-5 h-5 bg-[#242424] border border-gray-700 rounded
checked:bg-white checked:border-white
focus:outline-none focus:ring-2 focus:ring-white/20
cursor-pointer
```

**Пример:**
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={isChecked}
    onChange={(e) => setIsChecked(e.target.checked)}
    className="w-5 h-5 bg-[#242424] border border-gray-700 rounded checked:bg-white checked:border-white focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
  />
  <span className="text-sm text-gray-300">Безлимит</span>
</label>
```

---

### 7. Карточки статистики

#### Стандартная карточка (без клика):
```css
bg-[#151515] rounded-2xl p-6

/* Иконка */
p-2 bg-[#242424] rounded-lg
```

#### Интерактивная карточка (кликабельная):
```css
bg-[#151515] hover:bg-[#1a1a1a] rounded-2xl p-6
transition-all cursor-pointer group
```

**Структура:**
```tsx
<div className="bg-[#151515] rounded-2xl p-6">
  {/* Иконка + заголовок */}
  <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-[#242424] rounded-lg">
      <Icons.Users className="h-5 w-5 text-white" />
    </div>
    <h3 className="text-sm font-medium text-gray-400">
      Всего пользователей
    </h3>
  </div>
  
  {/* Значение */}
  <p className="text-2xl font-bold text-white">
    {(1234).toLocaleString()}
  </p>
</div>
```

#### Особенности:
- Скругленные углы (rounded-2xl = 16px)
- Иконка в отдельном контейнере с фоном
- Заголовок в сером цвете, маленький размер
- Значение крупным шрифтом (text-2xl или text-3xl)
- Использование `.toLocaleString()` для чисел (разделители тысяч)
- Hover эффект для кликабельных карточек
- Group эффект для изменения дочерних элементов при hover

---

### 8. Таблицы

#### Контейнер таблицы:
```css
bg-[#151515] rounded-2xl overflow-hidden
```

#### Таблица:
```css
w-full

/* Заголовок */
thead: bg-[#242424]
th: px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider

/* Строки */
tbody: divide-y divide-gray-700/50
tr: hover:bg-[#1a1a1a] transition-colors cursor-pointer
td: px-6 py-4 text-sm text-white
```

#### Особенности:
- Фиксированная ширина колонок или `whitespace-nowrap`
- Hover эффект на строках (для кликабельных)
- Разделители между строками (тонкие линии)
- Липкий заголовок (sticky) при длинных таблицах (опционально)
- Состояние загрузки (skeleton loader)
- Пустое состояние (empty state) с иконкой и текстом

**Skeleton loader для таблиц:**
```tsx
{loading ? (
  <div className="animate-pulse space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-[#242424] rounded-lg" />
    ))}
  </div>
) : (
  <table>...</table>
)}
```

**Empty state:**
```tsx
{data.length === 0 ? (
  <div className="text-center py-12">
    <Icons.Inbox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <p className="text-gray-400">Нет данных для отображения</p>
  </div>
) : (
  <table>...</table>
)}
```

---

### 9. Пагинация

**Путь:** `src/components/dashboard/Pagination.tsx`

```css
/* Контейнер */
flex items-center justify-between p-4 bg-[#151515] rounded-2xl

/* Кнопки */
px-3 py-2 bg-[#242424] hover:bg-[#363636] rounded-lg
disabled:opacity-50 disabled:cursor-not-allowed

/* Активная страница */
bg-white text-black
```

**Структура:**
```tsx
<div className="flex items-center justify-between p-4 bg-[#151515] rounded-2xl">
  {/* Информация */}
  <span className="text-sm text-gray-400">
    Показано {start}-{end} из {total}
  </span>
  
  {/* Кнопки навигации */}
  <div className="flex items-center gap-2">
    <button disabled={currentPage === 1}>Предыдущая</button>
    {pages.map(page => (
      <button 
        key={page}
        className={page === currentPage ? 'bg-white text-black' : 'bg-[#242424]'}
      >
        {page}
      </button>
    ))}
    <button disabled={currentPage === totalPages}>Следующая</button>
  </div>
</div>
```

---

### 10. Фильтры

**Примеры:** `UsersFilter.tsx`, `QuestionsFilter.tsx`

#### Контейнер фильтров:
```css
bg-[#151515] rounded-2xl p-6 space-y-4
```

#### Сетка фильтров:
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
```

#### Особенности:
- Используется компонент Select для выпадающих списков
- Поле поиска с иконкой лупы слева
- Кнопка "Очистить фильтры" для сброса
- Фильтры по датам (DateFilter компонент)
- Адаптивная сетка (1-2-4 колонки в зависимости от экрана)

**Поле поиска:**
```tsx
<div className="flex-1 relative">
  <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
  <input
    type="text"
    placeholder="Поиск..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-10 pr-4 py-2 bg-[#242424] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white"
  />
</div>
```

---

### 11. Фильтры по датам (DateFilter)

**Путь:** `src/components/dashboard/DateFilter.tsx`

#### Быстрые фильтры (кнопки):
```css
/* Неактивная кнопка */
px-4 py-2 rounded-xl text-sm font-medium
bg-[#242424] text-gray-400 border border-gray-700/50
hover:text-white hover:bg-[#363636]

/* Активная кнопка */
bg-[#363636] text-white border-white
```

#### Кастомный диапазон:
- Два поля даты (от/до)
- Два поля времени (от/до)
- Кнопка "Применить"

**Быстрые фильтры:**
- Сегодня
- Вчера
- 7 дней
- 30 дней
- Этот месяц

**Особенности:**
- Активная кнопка остается белой (не переключается на темную при нажатии)
- Плавные переходы между состояниями
- Сворачиваемый кастомный диапазон (показывается по клику)

---

## 📐 Структура макета

### Layout компонент

**Путь:** `src/components/dashboard/DashboardLayout.tsx`

```
┌──────────────────────────────────────┐
│         Header (fixed)               │ height: 64px (h-16)
│ Logo + Search + Lang + Notifications│ top-4 left-4 right-4
└──────────────────────────────────────┘

┌────────┬─────────────────────────────┐
│        │                             │
│ Side   │   Main Content              │
│ bar    │   pt-24 lg:pl-72           │
│ (fix)  │   padding: 1rem lg:1.5rem  │
│        │                             │
│ 256px  │   (dynamic content)         │
│ (w-64) │                             │
│        │                             │
└────────┴─────────────────────────────┘
```

### Размеры и отступы:

**Header:**
- Фиксированный: `fixed top-4 left-4 right-4`
- Высота: `h-16` (64px)
- Отступ внутри: `px-4 lg:px-6`
- Z-index: `z-50`
- Скругление: `rounded-2xl`
- Фон: `bg-[#151515]`
- Тень: `shadow-2xl`

**Sidebar:**
- Фиксированный: `fixed top-24 left-4`
- Ширина: `w-64` (256px)
- Высота: `h-[calc(100vh-7rem)]` (полная высота минус header и отступы)
- Z-index: `z-40`
- Скругление: `rounded-2xl`
- Фон: `bg-[#151515]`
- На мобильных: скрывается (transform: translateX(-100%))
- На десктопе (lg): `lg:translate-x-0` (всегда видим)

**Main Content:**
- Отступ сверху: `pt-24` (под header)
- Отступ слева на десктопе: `lg:pl-72` (под sidebar + отступ)
- Padding: `p-4 lg:p-6`
- Flex: `flex-1 min-h-0`

**Mobile overlay** (для sidebar):
- Затемнение: `fixed inset-0 bg-black/50 z-30`
- Показывается только на мобильных при открытом меню
- Закрывает sidebar при клике

---

### Header компонент

**Путь:** `src/components/dashboard/Header.tsx`

#### Структура:

```
┌─────────────────────────────────────────────────────────┐
│ [☰] Logo  Bilimpoz Admin     [Search] [Lang] [🔔] [👤] │
└─────────────────────────────────────────────────────────┘
```

**Левая часть:**
- Кнопка меню (lg:hidden) - только на мобильных
- Логотип (белый квадрат с буквой "B")
- Название приложения (hidden на маленьких экранах)

**Правая часть:**
- Поле поиска (hidden md:flex) - только на планшетах и десктопе
- Переключатель языка (LanguageSwitcher)
- Кнопка уведомлений с красной точкой (badge)
- Меню профиля с аватаром и именем пользователя

#### Поиск в header:
```tsx
<div className="hidden md:flex items-center relative">
  <Icons.Search className="absolute left-4 h-4 w-4 text-gray-400" />
  <input
    type="text"
    placeholder="Поиск..."
    className="pl-12 pr-4 py-3 bg-[#242424] border-0 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all w-64"
  />
</div>
```

#### Меню профиля:
```tsx
<div className="relative">
  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
    {/* Аватар + имя + стрелка */}
  </button>
  
  {isProfileMenuOpen && (
    <div className="absolute right-0 mt-2 w-48 bg-[#151515] rounded-2xl shadow-2xl py-2 z-50">
      <button className="text-red-400">Выйти</button>
    </div>
  )}
</div>
```

---

### Sidebar компонент

**Путь:** `src/components/dashboard/Sidebar.tsx`

#### Структура:

```
┌──────────────┐
│ Dashboard    │ ← активный
├──────────────┤
│ Курсы        │
├──────────────┤
│ Пользователи │
├──────────────┤
│ Рассылки     │
├──────────────┤
│ Подписки     │
├──────────────┤
│ Тесты        │
├──────────────┤
│ Вопросы      │
├──────────────┤
│ Настройки    │
└──────────────┘
```

#### Пункт меню:

**Неактивный:**
```css
flex items-center gap-3 px-4 py-3 rounded-lg
text-gray-400 hover:bg-[#242424] hover:text-white
transition-all
```

**Активный:**
```css
flex items-center gap-3 px-4 py-3 rounded-lg
bg-white text-black font-semibold
```

**Структура кода:**
```tsx
<Link 
  href="/dashboard/users"
  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
    pathname === '/dashboard/users' 
      ? 'bg-white text-black font-semibold' 
      : 'text-gray-400 hover:bg-[#242424] hover:text-white'
  }`}
>
  <Icons.UserGroup className="h-5 w-5" />
  <span>Пользователи</span>
</Link>
```

#### Особенности:
- Использует `usePathname()` для определения активной страницы
- Иконки из `Icons` компонента
- Плавные переходы (transition-all)
- На мобильных: закрывается автоматически при переходе на страницу
- Overlay затемнение на мобильных (закрывается при клике)

---

## 🎭 Интерактивность и анимации

### Переходы (Transitions)

**Стандартный переход:**
```css
transition-all duration-200
```

**Плавный переход:**
```css
transition-all duration-300 ease-in-out
```

**Быстрый переход:**
```css
transition-colors duration-150
```

### Hover эффекты

**Кнопки:**
```css
hover:scale-[1.02]        /* Легкое увеличение */
active:scale-[0.98]       /* Легкое уменьшение при клике */
```

**Карточки:**
```css
hover:bg-[#1a1a1a]        /* Легкое осветление фона */
transition-all             /* Плавный переход */
```

**Ссылки и пункты меню:**
```css
hover:text-white          /* Осветление текста */
hover:bg-[#242424]        /* Фон при наведении */
```

### Анимации

**Загрузка (spinner):**
```css
animate-spin              /* Вращение */
```

**Пульсация (skeleton):**
```css
animate-pulse             /* Эффект загрузки */
```

**Появление модального окна:**
```css
/* Оверлей */
animation: fadeIn 0.2s ease-in-out

/* Модальное окно */
animation: scaleIn 0.2s ease-in-out

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

**Появление toast:**
```css
animation: slideInRight 0.3s ease-in-out

@keyframes slideInRight {
  from { 
    opacity: 0; 
    transform: translateX(100%); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}
```

### Focus состояния

**Стандартный focus для input/select/textarea:**
```css
focus:outline-none 
focus:ring-2 
focus:ring-white/20
```

**Focus для кнопок:**
```css
focus:outline-none 
focus:ring-2 
focus:ring-offset-2 
focus:ring-offset-black
focus:ring-white/30
```

### Disabled состояния

```css
disabled:opacity-50
disabled:cursor-not-allowed
```

---

## 📱 Адаптивность

### Breakpoints (Tailwind)

```css
sm:  640px   /* Маленькие планшеты */
md:  768px   /* Планшеты */
lg:  1024px  /* Десктоп */
xl:  1280px  /* Большие десктопы */
2xl: 1536px  /* Очень большие экраны */
```

### Адаптивные паттерны

**Сетки:**
```css
/* 1 колонка на мобильных, 2 на планшетах, 4 на десктопе */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```

**Скрытие/показ элементов:**
```css
hidden md:flex          /* Скрыт на мобильных, виден на планшетах+ */
lg:hidden               /* Скрыт на десктопе */
block sm:hidden         /* Виден только на мобильных */
```

**Отступы:**
```css
p-4 lg:p-6              /* Меньше на мобильных, больше на десктопе */
gap-4 lg:gap-6          /* Адаптивный gap */
```

**Flex направление:**
```css
flex flex-col sm:flex-row  /* Вертикально на мобильных, горизонтально на планшетах+ */
```

**Размеры текста:**
```css
text-sm md:text-base    /* Меньше на мобильных */
text-xl lg:text-2xl     /* Больше на десктопе */
```

### Мобильная навигация

- Sidebar скрывается слева (transform: translateX(-100%))
- Кнопка меню (гамбургер) в header показывается (lg:hidden)
- Overlay затемнение при открытом меню
- Автоматическое закрытие при переходе на страницу
- Закрытие при клике вне sidebar

### Модальные окна на мобильных

```css
/* Контейнер модального окна */
p-4                     /* Отступ по краям экрана */
max-w-2xl w-full       /* Адаптивная ширина */
max-h-[90vh]           /* Не более 90% высоты экрана */
overflow-y-auto        /* Прокрутка если не помещается */
```

---

## 📄 Паттерны страниц

### Стандартная структура страницы

```tsx
export default function SomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 1. Заголовок страницы */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Заголовок страницы
            </h1>
            <p className="text-gray-400">
              Описание страницы
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Кнопки действий */}
          </div>
        </div>

        {/* 2. Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Карточки статистики */}
        </div>

        {/* 3. Фильтры */}
        <FilterComponent 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        {/* 4. Основной контент (таблица/карточки) */}
        <div className="bg-[#151515] rounded-2xl overflow-hidden">
          {/* Контент */}
        </div>

        {/* 5. Пагинация */}
        {pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        )}

        {/* 6. Модальные окна */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            {/* Содержимое модального окна */}
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
```

### Пример страницы с вкладками

```tsx
export default function PageWithTabs() {
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2'>('tab1');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Заголовок</h1>
          <p className="text-gray-400">Описание</p>
        </div>

        {/* Вкладки */}
        <div className="bg-[#151515] rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('tab1')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tab1'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#242424]'
            }`}
          >
            Вкладка 1
          </button>
          <button
            onClick={() => setActiveTab('tab2')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tab2'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#242424]'
            }`}
          >
            Вкладка 2
          </button>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'tab1' ? (
          <div>{/* Контент вкладки 1 */}</div>
        ) : (
          <div>{/* Контент вкладки 2 */}</div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

---

## 🎨 Скроллбар (кастомный)

```css
/* Стандартный скроллбар */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #606060;
}

/* Тонкий скроллбар для модальных окон */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}
```

---

## 🔧 Вспомогательные утилиты

### Тени

```css
shadow-sm      /* Легкая тень */
shadow-md      /* Средняя тень */
shadow-lg      /* Большая тень */
shadow-xl      /* Очень большая тень */
shadow-2xl     /* Максимальная тень */
```

**Используется:**
- `shadow-2xl` для header, sidebar, модальных окон
- `shadow-lg` для primary кнопок
- `shadow-md` для вторичных кнопок

### Скругления

```css
rounded        /* 4px */
rounded-lg     /* 8px - для кнопок, полей ввода */
rounded-xl     /* 12px - для secondary элементов */
rounded-2xl    /* 16px - для карточек, контейнеров */
rounded-full   /* 50% - для аватаров, индикаторов */
```

### Backdrop blur

```css
backdrop-blur-sm   /* Легкое размытие для оверлеев */
```

---

## 📦 Пример полной страницы

```tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Icons } from '@/components/ui/Icons';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function ExamplePage() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Загрузка данных
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить данные'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Пример страницы
            </h1>
            <p className="text-gray-400">
              Описание страницы и её назначения
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setIsModalOpen(true)}
          >
            <Icons.Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#151515] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#242424] rounded-lg">
                <Icons.Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-400">
                Всего элементов
              </h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.length.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Контент */}
        <div className="bg-[#151515] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-[#242424] rounded-lg" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Inbox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400">Нет данных</p>
            </div>
          ) : (
            <table className="w-full">
              {/* Таблица с данными */}
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

## 🌐 Интернационализация (i18n)

### Структура переводов

**Файлы:** `src/locales/ru.json`, `src/locales/ky.json`

```json
{
  "header": {
    "title": "Bilimpoz Admin",
    "search": "Поиск...",
    "logout": "Выйти"
  },
  "sidebar": {
    "dashboard": "Dashboard",
    "users": "Пользователи",
    "courses": "Курсы"
  },
  "common": {
    "loading": "Загрузка...",
    "save": "Сохранить",
    "cancel": "Отмена",
    "delete": "Удалить"
  }
}
```

### Использование

```tsx
import { useTranslation } from '@/hooks/useTranslation';

const { t, getCurrentLanguage } = useTranslation();

// В JSX
<h1>{t('header.title')}</h1>
<Button>{t('common.save')}</Button>
```

---

## ✨ Ключевые принципы дизайна

1. **Темная тема**: Весь интерфейс построен на темных тонах (#0b0b0b - #242424)
2. **Белый акцент**: Белый цвет используется для привлечения внимания к важным элементам
3. **Высокий контраст**: Белый текст на темном фоне обеспечивает отличную читаемость
4. **Скругления**: Все элементы имеют скругленные углы (rounded-lg, rounded-xl, rounded-2xl)
5. **Тени**: Использование теней для создания глубины (shadow-lg, shadow-2xl)
6. **Плавность**: Все интерактивные элементы имеют transition-all для плавных переходов
7. **Консистентность**: Одинаковые отступы (p-6, gap-4, space-y-6) по всему приложению
8. **Адаптивность**: Mobile-first подход с адаптацией на все устройства
9. **Иерархия**: Ясная визуальная иерархия через размеры, цвета и расположение
10. **Feedback**: Hover эффекты, loading состояния, toast уведомления для обратной связи

---

**Последнее обновление:** 12 ноября 2025  
**Версия:** 1.0

---

© 2025 Bilimpoz. Все права защищены.

