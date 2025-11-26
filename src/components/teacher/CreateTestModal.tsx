'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'
import Input from '@/components/ui/Input'
import Select, { SelectOption } from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Toast, { ToastVariant } from '@/components/ui/Toast'
import { useTranslation } from '@/hooks/useTranslation'

export type TestSectionType = 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'

interface CreateTestModalProps {
  isOpen: boolean
  onClose: () => void
  teacherId: string
  onTestCreated?: () => void
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  onTestCreated
}) => {
  const { t, ready } = useTranslation()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState<'ru' | 'kg'>('ru')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; variant: ToastVariant }>({
    isOpen: false,
    message: '',
    variant: 'success'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Загружаем язык из localStorage при открытии
  useEffect(() => {
    if (isOpen && mounted) {
      const savedLanguage = localStorage.getItem('i18nextLng')
      if (savedLanguage === 'ky' || savedLanguage === 'kg') {
        setLanguage('kg')
      } else {
        setLanguage('ru')
      }
    }
  }, [isOpen, mounted])

  // Сбрасываем форму при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      // При закрытии сбрасываем все кроме языка
      setName('')
      setDescription('')
      setErrors({})
    }
  }, [isOpen])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  const languageOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'ru', label: getText('tests.russian', 'Русский') },
      { value: 'kg', label: getText('tests.kyrgyz', 'Кыргызский') }
    ]
  }, [t, mounted, ready, getText])

  // Валидация
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = getText('tests.createModal.nameRequired', 'Название теста обязательно для заполнения')
    }

    if (!description.trim()) {
      newErrors.description = getText('tests.createModal.descriptionRequired', 'Описание обязательно для заполнения')
    } else if (description.length > 600) {
      newErrors.description = getText('testEditor.validation.descriptionTooLong', 'Описание не должно превышать 600 символов')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Сохранение языка в localStorage
  const handleLanguageChange = (value: string) => {
    const newLanguage = value as 'ru' | 'kg'
    setLanguage(newLanguage)
    // Сохраняем в localStorage
    localStorage.setItem('i18nextLng', newLanguage === 'kg' ? 'ky' : 'ru')
  }

  // Обработка создания теста
  const handleCreate = async () => {
    if (!validate()) {
      return
    }

    if (!teacherId) {
      setToast({
        isOpen: true,
        message: getText('tests.authRequired', 'Необходима авторизация'),
        variant: 'error'
      })
      return
    }

    setIsLoading(true)
    try {
      // Сохраняем тест в базу данных
      const response = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          teacherId: teacherId,
          language: language
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Ошибка при создании теста')
      }

      const testData = result.data
      
      // Показываем уведомление о создании теста
      setToast({
        isOpen: true,
        message: getText('tests.testCreated', 'Тест успешно создан'),
        variant: 'success'
      })
      
      // Вызываем callback для обновления списка тестов
      if (onTestCreated) {
        onTestCreated()
      }
      
      // Закрываем модал
      onClose()
      
      // Переход в редактор с небольшой задержкой для показа уведомления
      setTimeout(() => {
        router.push(`/tests/${testData.id}`)
      }, 500)
    } catch (error) {
      console.error('Ошибка создания теста:', error)
      setToast({
        isOpen: true,
        message: getText('tests.createError', 'Ошибка при создании теста') + ': ' + (error instanceof Error ? error.message : String(error)),
        variant: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Обработка отмены - сброс полей кроме языка
  const handleCancel = () => {
    setName('')
    setDescription('')
    setErrors({})
    onClose()
  }

  // Очистка ошибок при изменении полей
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors({ ...errors, name: '' })
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    if (errors.description) {
      setErrors({ ...errors, description: '' })
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel()
        }
      }}
    >
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {getText('tests.createModal.title', 'Создать новый тест')}
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <Icons.X className="h-5 w-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Форма */}
        <div className="p-6 space-y-6">
          {/* Название теста */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('tests.createModal.name', 'Название теста')} <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={getText('tests.createModal.namePlaceholder', 'Введите название теста')}
              error={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                {getText('tests.createModal.description', 'Описание')} <span className="text-red-400">*</span>
              </label>
              <span className={`text-xs ${
                description.length > 600 
                  ? 'text-red-400' 
                  : description.length > 550 
                    ? 'text-yellow-400' 
                    : 'text-[var(--text-tertiary)]'
              }`}>
                {description.length} / 600
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 600) {
                  setDescription(value)
                  if (errors.description) {
                    setErrors({ ...errors, description: '' })
                  }
                }
              }}
              placeholder={getText('tests.createModal.descriptionPlaceholder', 'Введите описание теста')}
              rows={4}
              maxLength={600}
              className={`
                w-full px-5 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm
                bg-[var(--bg-card)] border transition-all duration-300 ease-in-out resize-none
                focus:outline-none focus:border-[var(--text-primary)] hover:border-[var(--border-primary)]
                ${errors.description 
                  ? 'border-red-500 focus:border-red-400' 
                  : description.length > 600
                    ? 'border-red-500'
                    : 'border-[var(--border-primary)]'
                }
              `}
            />
            {errors.description && (
              <p className="text-sm text-red-400 mt-1">{errors.description}</p>
            )}
            {description.length > 600 && (
              <p className="text-sm text-red-400 mt-1">
                {getText('testEditor.descriptionTooLong', 'Описание не должно превышать 600 символов')}
              </p>
            )}
          </div>

          {/* Язык */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {getText('tests.createModal.language', 'Язык')} <span className="text-red-400">*</span>
            </label>
            <Select
              value={language}
              onChange={handleLanguageChange}
              options={languageOptions}
              placeholder={getText('tests.createModal.languagePlaceholder', 'Выберите язык')}
            />
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              {getText('common.cancel', 'Отмена')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreate}
              disabled={isLoading}
            >
              {isLoading 
                ? getText('common.loading', 'Создание...') 
                : getText('tests.createModal.createButton', 'Создать')
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Toast уведомления */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        variant={toast.variant}
        duration={4000}
      />
    </div>
  )
}

export default CreateTestModal

