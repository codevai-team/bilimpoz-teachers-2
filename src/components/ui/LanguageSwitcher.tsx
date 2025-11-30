'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Icons } from '@/components/ui/Icons';

export default function LanguageSwitcher() {
  const { t, changeLanguage, language, ready } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const languages = [
    { code: 'ru', name: 'RU', flag: '🇷🇺' },
    { code: 'ky', name: 'KG', flag: '🇰🇬' },
  ];
  
  // Получаем текущий язык из i18n
  const currentLang = language || 'ru';
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];
  
  // Показываем заглушку до монтирования или готовности i18n
  if (!mounted || !ready) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          disabled
        >
          <span className="text-sm text-[var(--text-primary)] font-medium">RU</span>
          <Icons.ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
        </button>
      </div>
    );
  }
  
  const handleLanguageChange = async (e: React.MouseEvent, langCode: 'ru' | 'ky') => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      console.log('LanguageSwitcher: Changing language to:', langCode);
      
      // Обновляем язык в i18n (changeLanguage уже сохраняет в cookie и localStorage)
      await changeLanguage(langCode);
      
      console.log('LanguageSwitcher: Language changed successfully');
      
      setIsOpen(false);
    } catch (error) {
      console.error('LanguageSwitcher: Error changing language:', error);
    }
  };
  
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        data-tooltip={t('common.language') || 'Переключить язык'}
      >
        <span className="text-sm text-[var(--text-primary)] font-medium">
          {currentLanguage.name}
        </span>
        <Icons.ChevronDown className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Overlay для закрытия */}
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Выпадающее меню */}
          <div 
            className="absolute right-0 mt-1 min-w-full bg-[var(--bg-card)] rounded-lg shadow-2xl p-1 z-[60] border border-[var(--border-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageChange(e, lang.code as 'ru' | 'ky');
                }}
                className={`
                  flex items-center justify-center w-full px-3 py-2 text-sm transition-colors rounded-md cursor-pointer font-medium
                  ${currentLang === lang.code 
                    ? 'bg-[var(--bg-active-button)] text-[var(--text-active-button)]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <span className="text-sm">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
