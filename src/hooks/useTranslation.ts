'use client';

import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n, ready } = useI18nTranslation();
  
  const changeLanguage = async (lng: string) => {
    try {
      console.log('useTranslation: Changing language to', lng);
      await i18n.changeLanguage(lng);
      console.log('useTranslation: Language changed, current:', i18n.language);
      
      // Сохраняем в cookie и localStorage для синхронизации
      if (typeof window !== 'undefined') {
        document.cookie = `lang=${lng}; path=/; max-age=31536000`;
        localStorage.setItem('i18nextLng', lng);
      }
    } catch (error) {
      console.error('useTranslation: Error changing language', error);
      throw error;
    }
  };
  
  const getCurrentLanguage = () => {
    return i18n.language || 'ru';
  };
  
  const isRussian = () => {
    const lang = i18n.language || 'ru';
    return lang === 'ru' || lang.startsWith('ru');
  };
  
  const isKyrgyz = () => {
    const lang = i18n.language || 'ru';
    return lang === 'ky' || lang.startsWith('ky');
  };
  
  // Нормализуем язык (может быть 'ru-RU' или 'ru')
  const normalizedLanguage = (i18n.language || 'ru')?.split('-')[0] || 'ru';
  
  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    isRussian,
    isKyrgyz,
    language: normalizedLanguage,
    ready,
  };
};
