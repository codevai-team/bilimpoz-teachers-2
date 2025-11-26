'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select, { SelectOption } from '@/components/ui/Select'
import Toast, { ToastVariant } from '@/components/ui/Toast'
import { useTranslation } from '@/hooks/useTranslation'

interface Test {
  id: string
  name: string
  description: string
  language: 'ru' | 'kg'
  status?: 'draft' | 'published'
  teacherId?: string
  createdAt?: string
  updatedAt?: string
}

interface TestSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  test: Test | null
  onSave: (data: { name: string; description: string; language: 'ru' | 'kg' }) => Promise<void>
  isSubmitting?: boolean
}

const TestSettingsModal: React.FC<TestSettingsModalProps> = ({
  isOpen,
  onClose,
  test,
  onSave,
  isSubmitting = false
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'ru' as 'ru' | 'kg'
  })
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; variant: ToastVariant }>({
    isOpen: false,
    message: '',
    variant: 'success'
  })

  const nameRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && test) {
      setFormData({
        name: test.name || '',
        description: test.description || '',
        language: test.language || 'ru'
      })
      setErrors({})
    }
  }, [isOpen, test])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  const languageOptions: SelectOption[] = [
    { value: 'ru', label: getText('testEditor.russian', 'Русский') },
    { value: 'kg', label: getText('testEditor.kyrgyz', 'Кыргызский') }
  ]

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = getText('testEditor.validation.nameRequired', 'Название теста обязательно')
      if (nameRef.current) {
        nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = getText('testEditor.validation.descriptionRequired', 'Описание теста обязательно')
      if (descriptionRef.current) {
        descriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else if (formData.description.length > 600) {
      newErrors.description = getText('testEditor.validation.descriptionTooLong', 'Описание не должно превышать 600 символов')
      if (descriptionRef.current) {
        descriptionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSave(formData)
      setToast({
        isOpen: true,
        message: getText('testEditor.testSaved', 'Тест сохранен'),
        variant: 'success'
      })
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      setToast({
        isOpen: true,
        message: getText('testEditor.saveError', 'Ошибка сохранения теста'),
        variant: 'error'
      })
    }
  }

  const handleInputChange = (field: 'name' | 'description' | 'language', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
    >
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-800 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] transition-colors">
            {getText('testEditor.editTest', 'Редактировать тест')}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.X className="h-5 w-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Основная информация */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-gray-800 dark:border-gray-800 pb-4 mb-6 transition-colors">
              {getText('testEditor.basicInfo', 'Основная информация')}
            </h2>
            
            <div className="space-y-6">
              {/* Название теста */}
              <div ref={nameRef}>
                <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors">
                  <Icons.Type className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
                  {getText('testEditor.testName', 'Название теста')} *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={getText('testEditor.enterTestName', 'Введите название теста')}
                  error={!!errors.name}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-2">{errors.name}</p>
                )}
              </div>

              {/* Описание теста */}
              <div ref={descriptionRef}>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] transition-colors">
                    <Icons.FileText className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
                    {getText('testEditor.testDescription', 'Описание теста')} *
                  </label>
                  <span className={`text-xs transition-colors ${
                    formData.description.length > 600 
                      ? 'text-red-400' 
                      : formData.description.length > 550 
                        ? 'text-yellow-400' 
                        : 'text-[var(--text-tertiary)]'
                  }`}>
                    {formData.description.length} / 600
                  </span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 600) {
                      handleInputChange('description', value)
                    }
                  }}
                  placeholder={getText('testEditor.enterTestDescription', 'Введите описание теста')}
                  disabled={isSubmitting}
                  rows={4}
                  maxLength={600}
                  className={`
                    w-full px-5 py-4 rounded-xl text-[var(--text-primary)] placeholder-gray-400
                    bg-[var(--bg-input)] border transition-all duration-300 ease-in-out
                    focus:outline-none focus:border-white hover:border-gray-500
                    ${errors.description ? 'border-red-500 focus:border-red-400' : 'border-gray-600'}
                    ${formData.description.length > 600 ? 'border-red-500' : ''}
                    resize-vertical
                  `}
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-2">{errors.description}</p>
                )}
                {formData.description.length > 600 && (
                  <p className="text-red-400 text-sm mt-2">
                    {getText('testEditor.descriptionTooLong', 'Описание не должно превышать 600 символов')}
                  </p>
                )}
              </div>

              {/* Язык */}
              <div>
                <label className="flex items-center text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors">
                  <Icons.Globe className="h-4 w-4 mr-2 text-[var(--text-primary)]" />
                  {getText('testEditor.testLanguage', 'Язык теста')}
                </label>
                <Select
                  value={formData.language}
                  onChange={(value) => handleInputChange('language', value)}
                  options={languageOptions}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-800 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {getText('common.cancel', 'Отмена')}
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? getText('testEditor.saving', 'Сохранение...') 
                : getText('common.save', 'Сохранить')
              }
            </Button>
          </div>
        </form>
      </div>

      {/* Toast уведомления */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        variant={toast.variant}
        duration={3000}
      />
    </div>
  )
}

export default TestSettingsModal


