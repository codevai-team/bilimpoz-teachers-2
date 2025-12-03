'use client'

import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'

export default function TestMobilePage() {
  const { isKeyboardOpen, viewportHeight, isMobile } = useMobileKeyboard()

  return (
    <div className="min-h-screen p-4 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <h1 className="text-2xl font-bold mb-6">Тест мобильного определения</h1>
      
      <div className="space-y-4 mb-8">
        <div className="p-4 bg-[var(--bg-card)] rounded-lg">
          <h2 className="font-semibold mb-2">Информация об устройстве:</h2>
          <ul className="space-y-1 text-sm">
            <li>Мобильное устройство: <strong>{isMobile ? 'Да' : 'Нет'}</strong></li>
            <li>Клавиатура открыта: <strong>{isKeyboardOpen ? 'Да' : 'Нет'}</strong></li>
            <li>Высота viewport: <strong>{viewportHeight}px</strong></li>
            <li>User Agent: <strong>{typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</strong></li>
            <li>Ширина экрана: <strong>{typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</strong></li>
            <li>Высота экрана: <strong>{typeof window !== 'undefined' ? window.innerHeight : 'N/A'}px</strong></li>
            <li>Visual Viewport: <strong>{typeof window !== 'undefined' && window.visualViewport ? 'Поддерживается' : 'Не поддерживается'}</strong></li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Тест полей ввода:</h2>
        <input 
          type="text" 
          placeholder="Введите текст здесь"
          className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
        />
        <textarea 
          placeholder="Многострочный текст"
          rows={4}
          className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
        />
      </div>

      <div className="mt-8 p-4 bg-[var(--bg-tertiary)] rounded-lg">
        <h3 className="font-semibold mb-2">Инструкции для тестирования:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Откройте эту страницу на iPhone</li>
          <li>Проверьте, что "Мобильное устройство" показывает "Да"</li>
          <li>Нажмите на поле ввода, чтобы открыть клавиатуру</li>
          <li>Проверьте, что "Клавиатура открыта" изменилось на "Да"</li>
          <li>Закройте клавиатуру и проверьте, что статус изменился обратно</li>
        </ol>
      </div>
    </div>
  )
}

