'use client'

import { useState, useEffect } from 'react'

type Language = 'ru' | 'kg'

interface Translations {
  [key: string]: string | Translations
}

const translations: Record<Language, Translations> = {
  ru: {
    tooltips: {
      bold: 'Жирный',
      italic: 'Курсив',
      strikethrough: 'Зачёркнутый',
      underline: 'Подчёркнутый',
      ai: 'AI функции',
      imageToLatex: 'Изображение в LaTeX',
      aiImproveText: 'Улучшить текст с помощью AI'
    },
    testEditor: {
      inlineFormula: 'Формула в строке',
      blockFormula: 'Формула в блоке',
      previewMode: 'Режим предпросмотра',
      editMode: 'Режим редактирования'
    }
  },
  kg: {
    tooltips: {
      bold: 'Калың',
      italic: 'Курсив',
      strikethrough: 'Сызылган',
      underline: 'Асты сызылган',
      ai: 'AI функциялар',
      imageToLatex: 'Сүрөттү LaTeX кылуу',
      aiImproveText: 'AI менен текстти жакшыртуу'
    },
    testEditor: {
      inlineFormula: 'Саптагы формула',
      blockFormula: 'Блоктогу формула',
      previewMode: 'Алдын ала көрүү режими',
      editMode: 'Редакциялоо режими'
    }
  }
}

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('ru')

  useEffect(() => {
    // Получаем язык из cookie или localStorage
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && (savedLang === 'ru' || savedLang === 'kg')) {
      setLanguage(savedLang)
    }
  }, [])

  const getCurrentLanguage = (): Language => {
    return language
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Возвращаем ключ, если перевод не найден
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return { t, getCurrentLanguage, language, setLanguage }
}


