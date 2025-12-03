import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import ruTranslations from '../locales/ru.json';
import kyTranslations from '../locales/ky.json';

const resources = {
  ru: {
    translation: ruTranslations,
  },
  ky: {
    translation: kyTranslations,
  },
};

// Инициализируем только если еще не инициализирован
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'ru',
      debug: false, // Отключаем отладочные сообщения
      
      // Возвращаем ключ, если перевод не найден (по умолчанию)
      // Но мы обрабатываем это в компонентах через fallback
      returnNull: false,
      returnEmptyString: false,
      returnObjects: false,
      
      // Отключаем предупреждения о missingKey в консоли
      saveMissing: false,
      updateMissing: false,
      missingKeyHandler: (lngs: readonly string[], ns: string, key: string) => {
        // Не выводим предупреждения в консоль
        // Функция должна возвращать void, но i18next сам обработает отсутствующий ключ
      },
      
      interpolation: {
        escapeValue: false, // React уже экранирует значения
      },
      
      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        caches: ['cookie', 'localStorage'],
        lookupCookie: 'lang',
        lookupLocalStorage: 'i18nextLng',
        cookieMinutes: 525600, // 1 год в минутах
      },
      
      react: {
        useSuspense: false, // Отключаем Suspense для Next.js
      },
    })
    .catch((error) => {
      console.error('i18n initialization error:', error);
    });
}

export default i18n;

