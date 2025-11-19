'use client'

import React, { useState, useEffect, useMemo } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import Select, { SelectOption } from '@/components/ui/Select'
import { Icons } from '@/components/ui/Icons'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function SettingsPage() {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { logout } = useAuth()
  
  // Состояние формы
  const [formData, setFormData] = useState({
    name: 'Nasl',
    profilePhoto: null as File | null,
    language: 'ru',
    telegramLogin: '@nasl_teacher',
    instagramLogin: 'nasl.teacher',
    whatsappLogin: '+996555123456',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

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
    
    // Имитация сохранения
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    setIsEditing(false)
    
    // Здесь можно показать toast уведомление
    console.log('Настройки сохранены')
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Сброс формы к исходным значениям
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }))
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(getText('settings.passwordMismatch', 'Пароли не совпадают'))
      return
    }

    setIsSaving(true)
    
    // Имитация смены пароля
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    
    console.log('Пароль изменен')
  }

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('settings.title')}
            </h1>
            <p className="text-gray-400">
              {t('settings.description')}
            </p>
          </div>
          
          {!isEditing ? (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              <Icons.Edit className="h-4 w-4 mr-2" />
              {t('settings.edit')}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {t('settings.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
              >
                <Icons.Save className="h-4 w-4 mr-2" />
                {t('settings.save')}
              </Button>
            </div>
          )}
        </div>

        {/* Основная информация */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            {t('settings.basicInfo')}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Фото профиля */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                {t('settings.profilePhoto')}
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#363636] rounded-full flex items-center justify-center">
                  <Icons.User className="h-8 w-8 text-white" />
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
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#242424] text-white rounded-lg hover:bg-[#363636] transition-colors"
                    >
                      <Icons.Camera className="h-4 w-4" />
                      {t('settings.changePhoto')}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                placeholder={t('settings.namePlaceholder')}
              />
            </div>

            {/* Язык интерфейса */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.interfaceLanguage')}
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
        <div className="bg-[#151515] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            {t('settings.socialNetworks')}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Telegram */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.telegram')}
              </label>
              <div className="relative">
                <Icons.MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.telegramLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramLogin: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                  placeholder={t('settings.telegramPlaceholder')}
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.instagram')}
              </label>
              <div className="relative">
                <Icons.Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.instagramLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramLogin: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                  placeholder={t('settings.instagramPlaceholder')}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.whatsapp')}
              </label>
              <div className="relative">
                <Icons.Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.whatsappLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappLogin: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                  placeholder={t('settings.whatsappPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            {t('settings.changePassword')}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.currentPassword')}
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565]"
                placeholder={t('settings.currentPasswordPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.newPassword')}
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565]"
                placeholder={t('settings.newPasswordPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.confirmPassword')}
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565]"
                placeholder={t('settings.confirmPasswordPlaceholder')}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="warning"
                onClick={handlePasswordChange}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                isLoading={isSaving}
              >
                <Icons.Key className="h-4 w-4 mr-2" />
                {t('settings.changePasswordButton')}
              </Button>
            </div>
          </div>
        </div>

        {/* Выход из системы */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('settings.logout')}
              </h3>
              <p className="text-gray-400">
                {t('settings.logoutDescription')}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowLogoutDialog(true)}
            >
              <Icons.LogOut className="h-4 w-4 mr-2" />
              {t('settings.logoutButton')}
            </Button>
          </div>
        </div>
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
    </TeacherLayout>
  )
}

