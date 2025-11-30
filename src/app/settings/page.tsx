'use client'

import React, { useState, useEffect, useMemo } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import Select, { SelectOption } from '@/components/ui/Select'
import { Icons } from '@/components/ui/Icons'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useTheme } from '@/components/providers/ThemeProvider'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import type { ToastVariant } from '@/components/ui/Toast'

export default function SettingsPage() {
  const { t, ready } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { logout } = useAuth()
  
  // Состояние формы
  const [formData, setFormData] = useState({
    name: '',
    profilePhoto: null as File | null,
    profilePhotoUrl: '',
    language: 'ru',
    telegramLogin: '',
    instagramLogin: '',
    whatsappLogin: '',
  })
  
  const [originalData, setOriginalData] = useState(formData)
  const [isLoading, setIsLoading] = useState(true)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [toast, setToast] = useState<{
    isOpen: boolean
    title?: string
    message: string
    variant: ToastVariant
  }>({
    isOpen: false,
    message: '',
    variant: 'success'
  })

  useEffect(() => {
    setMounted(true)
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/profile')
      
      if (response.ok) {
        const userData = await response.json()
        const profileData = {
          name: userData.name || '',
          profilePhoto: null,
          profilePhotoUrl: userData.profile_photo_url || '',
          language: userData.language || 'ru',
          telegramLogin: userData.social_networks?.telegram_login || '',
          instagramLogin: userData.social_networks?.instagram_login || '',
          whatsappLogin: userData.social_networks?.whatsapp_login || '',
        }
        setFormData(profileData)
        setOriginalData(profileData)
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const languageOptions: SelectOption[] = useMemo(() => {
    if (!mounted || !ready) return []
    return [
      { value: 'ru', label: t('questions.languages.ru') },
      { value: 'kg', label: t('questions.languages.kg') },
    ]
  }, [t, mounted, ready])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Сначала загружаем фото если оно изменилось
      let photoUrl = formData.profilePhotoUrl
      if (formData.profilePhoto) {
        const photoFormData = new FormData()
        photoFormData.append('photo', formData.profilePhoto)
        
        const photoResponse = await fetch('/api/user/upload-photo', {
          method: 'POST',
          body: photoFormData
        })
        
        if (photoResponse.ok) {
          const photoResult = await photoResponse.json()
          photoUrl = photoResult.photo_url
        }
      }
      
      // Обновляем профиль
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          language: formData.language,
          social_networks: {
            telegram_login: formData.telegramLogin,
            instagram_login: formData.instagramLogin,
            whatsapp_login: formData.whatsappLogin
          }
        })
      })
      
      if (response.ok) {
        const updatedData = { ...formData, profilePhotoUrl: photoUrl, profilePhoto: null }
        setFormData(updatedData)
        setOriginalData(updatedData)
        setIsEditing(false)
        setToast({
          isOpen: true,
          title: 'Сохранено!',
          message: getText('settings.saveSuccess', 'Настройки успешно сохранены'),
          variant: 'success'
        })
      } else {
        const error = await response.json()
        setToast({
          isOpen: true,
          message: error.error || getText('settings.saveError', 'Ошибка сохранения'),
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setToast({
        isOpen: true,
        message: getText('settings.saveError', 'Ошибка сохранения'),
        variant: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({ ...originalData, profilePhoto: null })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }))
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setToast({
        isOpen: true,
        message: getText('settings.passwordMismatch', 'Пароли не совпадают'),
        variant: 'error'
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setToast({
        isOpen: true,
        message: getText('settings.passwordTooShort', 'Пароль должен содержать минимум 6 символов'),
        variant: 'error'
      })
      return
    }

    setIsSaving(true)
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setToast({
          isOpen: true,
          message: getText('settings.passwordChanged', 'Пароль успешно изменен'),
          variant: 'success'
        })
      } else {
        const error = await response.json()
        setToast({
          isOpen: true,
          message: error.error || getText('settings.passwordChangeError', 'Ошибка смены пароля'),
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('Ошибка смены пароля:', error)
      setToast({
        isOpen: true,
        message: getText('settings.passwordChangeError', 'Ошибка смены пароля'),
        variant: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
  }

  return (
    <TeacherLayout>
      <div className="space-y-4 sm:space-y-5 md:space-y-6 pb-12 sm:pb-14 lg:pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
          </div>
        ) : (
          <>
        {/* Заголовок страницы */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4">
          {!isEditing ? (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto"
            >
              <Icons.Edit className="h-4 w-4 mr-2" />
              {getText('settings.edit', 'Редактировать')}
            </Button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                {getText('settings.cancel', 'Отмена')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                className="flex-1 sm:flex-none"
              >
                <Icons.Save className="h-4 w-4 mr-2" />
                {getText('settings.save', 'Сохранить')}
              </Button>
            </div>
          )}
        </div>

        {/* Сетка блоков настроек */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Основная информация */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
              {getText('settings.basicInfo', 'Основная информация')}
            </h1>
            <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
              {/* Фото профиля */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-4">
                  {getText('settings.profilePhoto', 'Фото профиля')}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center overflow-hidden">
                    {formData.profilePhotoUrl || formData.profilePhoto ? (
                      <img 
                        src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : formData.profilePhotoUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icons.User className="h-8 w-8 text-[var(--text-primary)]" />
                    )}
                  </div>
                  {isEditing && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <Icons.Camera className="h-4 w-4" />
                        {getText('settings.changePhoto', 'Изменить фото')}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Имя */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.name', 'Имя')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                  placeholder={getText('settings.namePlaceholder', 'Введите ваше имя')}
                />
              </div>
            </div>
          </div>

          {/* Настройки интерфейса */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
              {getText('settings.interface', 'Настройки интерфейса')}
            </h1>
            <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
              {/* Тема */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.theme', 'Тема')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Icons.Sun className="h-4 w-4" />
                        {getText('settings.lightTheme', 'Светлая тема')}
                      </>
                    ) : (
                      <>
                        <Icons.Moon className="h-4 w-4" />
                        {getText('settings.darkTheme', 'Темная тема')}
                      </>
                    )}
                  </button>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {getText('settings.currentTheme', 'Текущая')}: {theme === 'dark' ? getText('settings.dark', 'Темная') : getText('settings.light', 'Светлая')}
                  </span>
                </div>
              </div>

              {/* Язык интерфейса */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.interfaceLanguage', 'Язык интерфейса')}
                </label>
                <Select
                  value={formData.language}
                  onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  options={languageOptions}
                  className={!isEditing ? 'opacity-50 pointer-events-none' : ''}
                />
              </div>
            </div>
          </div>

          {/* Социальные сети */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
              {getText('settings.socialNetworks', 'Социальные сети')}
            </h1>
            <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
              {/* Telegram */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.telegram', 'Telegram')}
                </label>
                <div className="relative">
                  <Icons.MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={formData.telegramLogin}
                    onChange={(e) => setFormData(prev => ({ ...prev, telegramLogin: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                    placeholder={getText('settings.telegramPlaceholder', '@username')}
                  />
                </div>
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.instagram', 'Instagram')}
                </label>
                <div className="relative">
                  <Icons.Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={formData.instagramLogin}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagramLogin: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                    placeholder={getText('settings.instagramPlaceholder', 'username')}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.whatsapp', 'WhatsApp')}
                </label>
                <div className="relative">
                  <Icons.Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={formData.whatsappLogin}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappLogin: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                    placeholder={getText('settings.whatsappPlaceholder', '+996555123456')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Смена пароля */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
              {getText('settings.changePassword', 'Смена пароля')}
            </h1>
            <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.currentPassword', 'Текущий пароль')}
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                  placeholder={getText('settings.currentPasswordPlaceholder', 'Введите текущий пароль')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.newPassword', 'Новый пароль')}
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                  placeholder={getText('settings.newPasswordPlaceholder', 'Введите новый пароль')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getText('settings.confirmPassword', 'Подтвердите пароль')}
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 bg-[var(--bg-tertiary)] border-[var(--border-primary)] disabled:opacity-50"
                  placeholder={getText('settings.confirmPasswordPlaceholder', 'Повторите новый пароль')}
                />
              </div>

              <div>
                <Button
                  variant="warning"
                  onClick={handlePasswordChange}
                  disabled={!isEditing || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  isLoading={isSaving}
                >
                  <Icons.Key className="h-4 w-4 mr-2" />
                  {getText('settings.changePasswordButton', 'Изменить пароль')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Выход из системы */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-5">
            {getText('settings.logout', 'Выход из системы')}
          </h1>
          <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <p className="text-sm sm:text-base text-[var(--text-tertiary)]">
                {getText('settings.logoutDescription', 'Завершить текущий сеанс работы')}
              </p>
              <Button
                variant="danger"
                onClick={() => setShowLogoutDialog(true)}
                className="w-full sm:w-auto"
              >
                <Icons.LogOut className="h-4 w-4 mr-2" />
                {getText('settings.logoutButton', 'Выйти')}
              </Button>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Диалог подтверждения выхода */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title={t('auth.confirmLogout', 'Подтвердите действие')}
        message={t('auth.confirmLogoutMessage', 'Вы уверены, что хотите выйти из системы?')}
        confirmText={t('auth.logout', 'Выйти')}
        cancelText={t('common.cancel', 'Отмена')}
        variant="danger"
      />

      {/* Toast уведомления */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        variant={toast.variant}
        duration={4000}
      />
    </TeacherLayout>
  )
}

