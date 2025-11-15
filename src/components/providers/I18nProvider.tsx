'use client';

import { useEffect } from 'react';
import '@/lib/i18n';
import i18n from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // i18n уже инициализирован через импорт
    // Проверяем, что инициализация прошла успешно
    if (i18n.isInitialized) {
      console.log('I18nProvider: i18n initialized, current language:', i18n.language);
    } else {
      console.warn('I18nProvider: i18n not initialized yet');
    }
  }, []);

  return <>{children}</>;
}

