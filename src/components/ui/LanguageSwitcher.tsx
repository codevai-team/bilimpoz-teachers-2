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
          className="flex items-center gap-2 px-3 py-2 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors"
          disabled
        >
          <span className="text-sm text-white font-medium">RU</span>
          <Icons.ChevronDown className="h-4 w-4 text-gray-400" />
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
        className="flex items-center gap-2 px-3 py-2 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors"
        data-tooltip={t('common.language') || 'Switch language'}
      >
        <span className="text-sm text-white font-medium">
          {currentLanguage.name}
        </span>
        <Icons.ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
            className="absolute right-0 mt-1 w-16 bg-[#151515] rounded-xl shadow-2xl py-1 z-[60] border border-gray-700/50"
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
                  flex items-center justify-center w-full py-1 text-sm transition-colors rounded-lg m-1 cursor-pointer
                  ${currentLang === lang.code 
                    ? 'bg-white text-black' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                style={{ width: 'calc(100% - 8px)' }}
              >
                <span className="text-base">{lang.flag}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
