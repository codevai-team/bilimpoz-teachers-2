# Документация: Формы входа и подтверждения кода Telegram

## Обзор

Данный документ описывает дизайн, структуру и стилизацию форм аутентификации в приложении Bilimpoz Admin:
- **Форма входа** (`LoginForm`)
- **Форма подтверждения кода Telegram** (`TelegramVerificationForm`)

---

## 1. Общая структура страниц

### 1.1 Страница входа (`/login`)

**Расположение файла:** `src/app/login/page.tsx`

**Структура:**
```tsx
<div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#0b0b0b'}>
  <div className="w-full max-w-md">
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-white tracking-tight">
        Bilimpoz Admin
      </h1>
    </div>
    <LoginForm />
  </div>
</div>
```

**Характеристики:**
- **Фон страницы:** `#0b0b0b` (почти черный)
- **Выравнивание:** Центрирование по вертикали и горизонтали (`flex items-center justify-center`)
- **Минимальная высота:** `min-h-screen` (100vh)
- **Отступы:** `p-4` (16px со всех сторон)
- **Максимальная ширина контейнера:** `max-w-md` (28rem / 448px)
- **Заголовок:** 
  - Размер: `text-4xl` (2.25rem / 36px)
  - Цвет: `text-white`
  - Начертание: `font-bold`
  - Межбуквенное расстояние: `tracking-tight`
  - Отступ снизу: `mb-12` (3rem / 48px)

### 1.2 Страница подтверждения кода (`/verify-telegram`)

**Расположение файла:** `src/app/verify-telegram/page.tsx`

**Структура:**
```tsx
<div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#0b0b0b'}>
  <div className="w-full max-w-md">
    <TelegramVerificationForm />
  </div>
</div>
```

**Характеристики:**
- **Фон страницы:** `#0b0b0b` (почти черный)
- **Выравнивание:** Центрирование по вертикали и горизонтали
- **Минимальная высота:** `min-h-screen`
- **Отступы:** `p-4`
- **Максимальная ширина контейнера:** `max-w-md`

---

## 2. Форма входа (LoginForm)

### 2.1 Контейнер формы

**Расположение файла:** `src/components/auth/LoginForm.tsx`

**Структура контейнера:**
```tsx
<div className="rounded-2xl p-10 shadow-2xl" style={{backgroundColor: '#151515'}}>
  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
    {/* Содержимое формы */}
  </form>
</div>
```

**Стили контейнера:**
- **Фон:** `#151515` (темно-серый)
- **Скругление углов:** `rounded-2xl` (1rem / 16px)
- **Внутренние отступы:** `p-10` (2.5rem / 40px)
- **Тень:** `shadow-2xl` (большая тень для глубины)
- **Отступы между элементами формы:** `space-y-6` (1.5rem / 24px)

### 2.2 Поле "Логин"

**Структура:**
```tsx
<div>
  <label htmlFor="login" className="block text-sm font-medium text-white mb-3">
    <div className="flex items-center gap-2">
      <MailIcon className="w-4 h-4" />
      Логин
    </div>
  </label>
  <Tooltip text="Введите ваш логин для входа в систему">
    <Input
      id="login"
      name="login"
      type="text"
      value={formData.login}
      onChange={handleChange}
      placeholder="admin"
      required
    />
  </Tooltip>
</div>
```

**Стили label:**
- **Отображение:** `block` (блочный элемент)
- **Размер текста:** `text-sm` (0.875rem / 14px)
- **Начертание:** `font-medium` (500)
- **Цвет:** `text-white`
- **Отступ снизу:** `mb-3` (0.75rem / 12px)
- **Иконка:** `MailIcon` размером `w-4 h-4` (1rem / 16px)
- **Отступ между иконкой и текстом:** `gap-2` (0.5rem / 8px)

**Компонент Input:**
- **Фон:** `#0b0b0b` (почти черный)
- **Цвет текста:** `text-white`
- **Цвет placeholder:** `placeholder-gray-400`
- **Внутренние отступы:** `px-5 py-4` (20px по горизонтали, 16px по вертикали)
- **Скругление:** `rounded-xl` (0.75rem / 12px)
- **Граница:** `border border-gray-600` (серая граница)
- **При наведении:** `hover:border-gray-500` (светлее)
- **При фокусе:** `focus:outline-none focus:border-white` (белая граница)
- **Переход:** `transition-all duration-300 ease-in-out` (плавные переходы 300ms)

### 2.3 Поле "Пароль"

**Структура:**
```tsx
<div>
  <label htmlFor="password" className="block text-sm font-medium text-white mb-3">
    <div className="flex items-center gap-2">
      <LockIcon className="w-4 h-4" />
      Пароль
    </div>
  </label>
  <Tooltip text="Введите ваш пароль">
    <div className="relative">
      <Input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={handleChange}
        placeholder="••••••••"
        required
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
      >
        {showPassword ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  </Tooltip>
</div>
```

**Особенности:**
- **Отступ справа для кнопки:** `pr-12` (3rem / 48px)
- **Кнопка показа/скрытия пароля:**
  - Позиционирование: `absolute right-3 top-1/2 transform -translate-y-1/2`
  - Цвет: `text-gray-400`
  - При наведении: `hover:text-white`
  - Переход: `transition-colors`

### 2.4 Блок ошибок

**Структура:**
```tsx
{error && (
  <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-red-400 text-sm font-medium">{error}</span>
    </div>
  </div>
)}
```

**Стили блока ошибок:**
- **Внутренние отступы:** `p-4` (1rem / 16px)
- **Скругление:** `rounded-lg` (0.5rem / 8px)
- **Граница:** `border border-red-500/30` (красная с прозрачностью 30%)
- **Фон:** `bg-red-500/10` (красный с прозрачностью 10%)
- **Иконка:** 
  - Размер: `w-5 h-5` (1.25rem / 20px)
  - Цвет: `text-red-400`
- **Текст ошибки:**
  - Цвет: `text-red-400`
  - Размер: `text-sm` (0.875rem / 14px)
  - Начертание: `font-medium`

### 2.5 Кнопка "Войти"

**Структура:**
```tsx
<Button
  type="submit"
  isLoading={isLoading}
  className="w-full mt-2"
>
  {isLoading ? 'Вход...' : 'Войти'}
</Button>
```

**Стили кнопки (variant: primary):**
- **Фон:** `bg-white` (белый)
- **Цвет текста:** `text-black` (черный)
- **Начертание:** `font-semibold` (600)
- **Граница:** `border border-white`
- **Тень:** `shadow-lg hover:shadow-xl`
- **При наведении:** 
  - Фон: `hover:bg-gray-100`
  - Масштаб: `hover:scale-[1.02]` (увеличение на 2%)
- **При нажатии:** `active:scale-[0.98]` (уменьшение на 2%)
- **Фокус:** `focus:ring-2 focus:ring-offset-2 focus:ring-white/30`
- **Ширина:** `w-full` (100%)
- **Отступ сверху:** `mt-2` (0.5rem / 8px)
- **Переход:** `transition-all duration-200`
- **Состояние загрузки:**
  - Показывается спиннер (анимированный круг)
  - Текст меняется на "Вход..."
  - Кнопка становится неактивной

---

## 3. Форма подтверждения кода Telegram (TelegramVerificationForm)

### 3.1 Контейнер формы

**Расположение файла:** `src/components/auth/TelegramVerificationForm.tsx`

**Структура контейнера:**
```tsx
<div className="rounded-2xl p-10 shadow-2xl" style={{backgroundColor: '#151515'}}>
  {/* Содержимое формы */}
</div>
```

**Стили контейнера:**
- **Фон:** `#151515` (темно-серый)
- **Скругление:** `rounded-2xl` (1rem / 16px)
- **Внутренние отступы:** `p-10` (2.5rem / 40px)
- **Тень:** `shadow-2xl`

### 3.2 Заголовок формы

**Структура:**
```tsx
<div className="text-center mb-8">
  <div className="flex items-center justify-center mb-4">
    <div className="bg-gray-500/20 p-3 rounded-full">
      <TelegramIcon className="w-8 h-8 text-white" />
    </div>
  </div>
  <h2 className="text-2xl font-bold text-white mb-2">Подтверждение входа</h2>
  <p className="text-gray-400 text-sm">
    Введите 6-значный код, отправленный в ваш Telegram
  </p>
</div>
```

**Стили заголовка:**
- **Выравнивание:** `text-center` (по центру)
- **Отступ снизу:** `mb-8` (2rem / 32px)
- **Иконка Telegram:**
  - Контейнер: `bg-gray-500/20 p-3 rounded-full` (серый фон с прозрачностью 20%, отступы 12px, круглый)
  - Размер иконки: `w-8 h-8` (2rem / 32px)
  - Цвет: `text-white`
  - Отступ снизу: `mb-4` (1rem / 16px)
- **Заголовок:**
  - Размер: `text-2xl` (1.5rem / 24px)
  - Начертание: `font-bold`
  - Цвет: `text-white`
  - Отступ снизу: `mb-2` (0.5rem / 8px)
- **Описание:**
  - Цвет: `text-gray-400`
  - Размер: `text-sm` (0.875rem / 14px)

### 3.3 Поля ввода кода

**Структура:**
```tsx
<div>
  <label className="block text-sm font-medium text-white mb-4">
    Код подтверждения
  </label>
  <div className="flex gap-3 justify-center">
    {code.map((digit, index) => (
      <input
        key={index}
        ref={(el) => { inputRefs.current[index] = el; }}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digit}
        onChange={(e) => handleInputChange(index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(index, e)}
        onPaste={handlePaste}
        className={`
          w-12 h-14 text-center text-xl font-bold
          text-white placeholder-gray-400
          rounded-xl border-2
          focus:outline-none focus:border-white
          hover:border-gray-500
          transition-all duration-300 ease-in-out
          ${error ? 'border-red-400' : 'border-gray-600'}
          ${digit ? 'border-white bg-white/10' : ''}
        `}
        style={{
          backgroundColor: digit ? undefined : '#0b0b0b'
        }}
      />
    ))}
  </div>
</div>
```

**Стили полей ввода кода:**
- **Контейнер:** `flex gap-3 justify-center` (flex-контейнер с отступами 12px между элементами, выравнивание по центру)
- **Размеры поля:**
  - Ширина: `w-12` (3rem / 48px)
  - Высота: `h-14` (3.5rem / 56px)
- **Текст:**
  - Выравнивание: `text-center` (по центру)
  - Размер: `text-xl` (1.25rem / 20px)
  - Начертание: `font-bold`
  - Цвет: `text-white`
  - Placeholder: `placeholder-gray-400`
- **Граница:**
  - Толщина: `border-2` (2px)
  - По умолчанию: `border-gray-600` (серая)
  - При ошибке: `border-red-400` (красная)
  - При заполнении: `border-white` (белая)
- **Фон:**
  - Пустое поле: `#0b0b0b` (почти черный)
  - Заполненное поле: `bg-white/10` (белый с прозрачностью 10%)
- **Интерактивность:**
  - При наведении: `hover:border-gray-500`
  - При фокусе: `focus:outline-none focus:border-white`
  - Переход: `transition-all duration-300 ease-in-out`
- **Скругление:** `rounded-xl` (0.75rem / 12px)

**Функциональность:**
- Автоматический переход к следующему полю при вводе
- Поддержка вставки 6-значного кода (paste)
- Навигация клавишами (Backspace возвращает к предыдущему полю)
- Разрешены только цифры

### 3.4 Таймер и повторная отправка

**Структура:**
```tsx
<div className="text-center">
  {timeLeft > 0 ? (
    <p className="text-sm text-gray-400">
      Код действителен еще: <span className="text-white font-mono">{formatTime(timeLeft)}</span>
    </p>
  ) : (
    <button
      type="button"
      onClick={handleResendCode}
      className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
    >
      Отправить ещё
    </button>
  )}
</div>
```

**Стили таймера:**
- **Выравнивание:** `text-center`
- **Текст:**
  - Размер: `text-sm` (0.875rem / 14px)
  - Цвет: `text-gray-400`
- **Время:**
  - Цвет: `text-white`
  - Шрифт: `font-mono` (моноширинный)
- **Кнопка повторной отправки:**
  - Размер: `text-sm`
  - Цвет: `text-gray-400`
  - При наведении: `hover:text-white`
  - Начертание: `font-medium`
  - Переход: `transition-colors`

**Логика:**
- Начальное время: 300 секунд (5 минут)
- Формат отображения: `MM:SS`
- После истечения времени показывается кнопка "Отправить ещё"

### 3.5 Кнопки формы

**Структура:**
```tsx
<div className="space-y-4">
  <Button
    type="submit"
    isLoading={isLoading}
    className="w-full"
    disabled={code.join('').length !== 6}
  >
    {isLoading ? 'Проверка кода...' : 'Подтвердить'}
  </Button>
  
  <div className="text-center">
    <button
      type="button"
      onClick={handleBackToLogin}
      className="text-gray-400 hover:text-gray-300 transition-colors text-sm inline-flex items-center gap-2"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Вернуться к входу
    </button>
  </div>
</div>
```

**Стили кнопки "Подтвердить":**
- **Ширина:** `w-full` (100%)
- **Состояние:** Отключена, если код не полный (менее 6 цифр)
- **Текст при загрузке:** "Проверка кода..."
- **Текст по умолчанию:** "Подтвердить"

**Стили кнопки "Вернуться к входу":**
- **Выравнивание:** `text-center`
- **Цвет:** `text-gray-400`
- **При наведении:** `hover:text-gray-300`
- **Размер:** `text-sm`
- **Отображение:** `inline-flex items-center gap-2`
- **Иконка:** `ArrowLeftIcon` размером `w-4 h-4`
- **Переход:** `transition-colors`

### 3.6 Блок ошибок

**Структура:**
```tsx
{error && (
  <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-red-400 text-sm font-medium">{error}</span>
    </div>
  </div>
)}
```

**Стили:** Аналогичны блоку ошибок в форме входа

---

## 4. Компоненты UI

### 4.1 Компонент Input

**Расположение:** `src/components/ui/Input.tsx`

**Базовые стили:**
- **Фон:** `#0b0b0b`
- **Цвет текста:** `text-white`
- **Placeholder:** `placeholder-gray-400`
- **Отступы:** `px-5 py-4`
- **Скругление:** `rounded-xl`
- **Граница:** `border border-gray-600`
- **При наведении:** `hover:border-gray-500`
- **При фокусе:** `focus:outline-none focus:border-white`
- **Переход:** `transition-all duration-300 ease-in-out`
- **Состояние ошибки:** `border-red-400 focus:border-red-400`

### 4.2 Компонент Button

**Расположение:** `src/components/ui/Button.tsx`

**Варианты (variants):**

#### Primary (по умолчанию):
- **Фон:** `bg-white`
- **Текст:** `text-black font-semibold`
- **Граница:** `border border-white`
- **Тень:** `shadow-lg hover:shadow-xl`
- **При наведении:** `hover:bg-gray-100 hover:scale-[1.02]`
- **При нажатии:** `active:scale-[0.98]`
- **Фокус:** `focus:ring-2 focus:ring-offset-2 focus:ring-white/30`

#### Secondary:
- **Фон:** `bg-[#242424]`
- **Текст:** `text-white font-semibold`
- **Граница:** `border border-gray-700/50`
- **При наведении:** `hover:bg-[#2a2a2a] hover:scale-[1.02]`

**Размеры (sizes):**
- **sm:** `px-3 py-1.5 text-sm`
- **md:** `px-5 py-2 text-base` (по умолчанию)
- **lg:** `px-8 py-3 text-lg`

**Состояние загрузки:**
- Показывается анимированный спиннер
- Кнопка становится неактивной

### 4.3 Компонент Tooltip

**Расположение:** `src/components/ui/Tooltip.tsx`

**Стили:**
- **Фон:** `#151515`
- **Граница:** `1px solid #404040`
- **Тень:** `0 2px 8px rgba(0, 0, 0, 0.3)`
- **Текст:** `text-white text-xs`
- **Скругление:** `rounded-md`
- **Z-index:** `z-[9999]`
- **Треугольный указатель:** Темно-серый с границей

---

## 5. Цветовая палитра

### Основные цвета:

| Элемент | Цвет | Hex | Tailwind класс |
|---------|------|-----|----------------|
| Фон страницы | Почти черный | `#0b0b0b` | - |
| Фон формы | Темно-серый | `#151515` | - |
| Фон полей ввода | Почти черный | `#0b0b0b` | - |
| Основной текст | Белый | `#ffffff` | `text-white` |
| Вторичный текст | Серый | `#9ca3af` | `text-gray-400` |
| Границы полей | Серый | `#4b5563` | `border-gray-600` |
| Границы при фокусе | Белый | `#ffffff` | `border-white` |
| Ошибки | Красный | `#f87171` | `text-red-400` |
| Фон ошибок | Красный (10%) | `rgba(239, 68, 68, 0.1)` | `bg-red-500/10` |
| Кнопка (primary) | Белый | `#ffffff` | `bg-white` |
| Кнопка текст | Черный | `#000000` | `text-black` |

### Градиенты и эффекты:

- **Тени:** `shadow-2xl`, `shadow-lg`, `shadow-xl`
- **Прозрачность:** Используется `/10`, `/20`, `/30` для создания полупрозрачных эффектов
- **Hover эффекты:** Изменение цвета, масштабирование (`scale-[1.02]`)

---

## 6. Типографика

### Шрифты:

- **Заголовок страницы:** `text-4xl font-bold` (36px, жирный)
- **Заголовок формы:** `text-2xl font-bold` (24px, жирный)
- **Labels:** `text-sm font-medium` (14px, средний)
- **Основной текст:** `text-base` (16px)
- **Вторичный текст:** `text-sm` (14px)
- **Код подтверждения:** `text-xl font-bold` (20px, жирный, моноширинный)
- **Таймер:** `font-mono` (моноширинный)

### Межбуквенные интервалы:

- **Заголовок:** `tracking-tight` (уменьшенный интервал)

---

## 7. Анимации и переходы

### Переходы:

- **Поля ввода:** `transition-all duration-300 ease-in-out` (300ms, плавный)
- **Кнопки:** `transition-all duration-200` (200ms)
- **Цвета:** `transition-colors` (переход только для цветов)

### Анимации:

- **Спиннер загрузки:** `animate-spin` (вращение)
- **Масштабирование кнопок:**
  - При наведении: `hover:scale-[1.02]` (увеличение на 2%)
  - При нажатии: `active:scale-[0.98]` (уменьшение на 2%)

---

## 8. Адаптивность

### Брейкпоинты:

- **Мобильные устройства:** `p-4` (отступы 16px)
- **Планшеты и десктопы:** `max-w-md` (максимальная ширина 448px)

### Адаптивные элементы:

- Форма центрируется на всех размерах экрана
- Поля ввода кода адаптируются под размер экрана
- Кнопки занимают всю ширину контейнера (`w-full`)

---

## 9. Доступность (Accessibility)

### ARIA и семантика:

- Использование `<label>` с `htmlFor` для связи с полями ввода
- Атрибут `required` для обязательных полей
- Атрибут `inputMode="numeric"` для полей кода
- Правильная структура заголовков (`h1`, `h2`)

### Клавиатурная навигация:

- Поддержка Tab для перехода между полями
- Enter для отправки формы
- Backspace для возврата к предыдущему полю ввода кода
- Поддержка вставки (paste) для кода

---

## 10. Особенности реализации

### Форма входа:

1. **Валидация:** HTML5 валидация (`required`) + кастомная валидация на сервере
2. **Показ/скрытие пароля:** Переключение через иконку глаза
3. **Обработка ошибок:** Отображение ошибок в специальном блоке
4. **Состояние загрузки:** Блокировка формы и показ спиннера

### Форма подтверждения кода:

1. **Автоматический переход:** При вводе цифры фокус переходит на следующее поле
2. **Вставка кода:** Поддержка вставки 6-значного кода из буфера обмена
3. **Таймер:** Обратный отсчет с форматированием времени
4. **Повторная отправка:** Кнопка появляется после истечения времени
5. **Валидация:** Проверка на полный 6-значный код перед отправкой
6. **Очистка при ошибке:** Автоматическая очистка полей и возврат фокуса

---

## 11. Иконки

### Используемые иконки:

- **MailIcon:** Для поля логина (16x16px)
- **LockIcon:** Для поля пароля (16x16px)
- **EyeIcon / EyeOffIcon:** Для показа/скрытия пароля
- **TelegramIcon:** Для формы подтверждения (32x32px)
- **ArrowLeftIcon:** Для кнопки возврата (16x16px)

**Цвета иконок:**
- Белый: `text-white`
- Серый: `text-gray-400`
- При наведении: `hover:text-white`

---

## 12. Заключение

Формы входа и подтверждения кода Telegram выполнены в едином стиле с темной цветовой схемой, обеспечивая:
- **Современный дизайн** с плавными переходами и анимациями
- **Удобство использования** с автоматическими переходами и поддержкой клавиатуры
- **Визуальную обратную связь** через состояния hover, focus, loading, error
- **Адаптивность** для различных размеров экранов
- **Доступность** через правильную семантику и навигацию

Все элементы следуют единой дизайн-системе с использованием темных оттенков (#0b0b0b, #151515) и акцентов белого цвета для интерактивных элементов.

