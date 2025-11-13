'use client'

import React, { useState } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import Button from '@/components/ui/Button'
import Select, { SelectOption } from '@/components/ui/Select'
import { Icons } from '@/components/ui/Icons'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
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

  const languageOptions: SelectOption[] = [
    { value: 'ru', label: 'Русский' },
    { value: 'kg', label: 'Кыргызча' },
  ]

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
      alert('Пароли не совпадают')
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

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
      await logout()
    }
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Настройки
            </h1>
            <p className="text-gray-400">
              Редактирование профиля и персональных настроек
            </p>
          </div>
          
          {!isEditing ? (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              <Icons.Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
              >
                <Icons.Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          )}
        </div>

        {/* Основная информация */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Основная информация
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Фото профиля */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Фото профиля
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
                      Изменить фото
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Имя *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                placeholder="Введите имя"
              />
            </div>

            {/* Язык интерфейса */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Язык интерфейса
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
            Социальные сети
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Telegram */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telegram
              </label>
              <div className="relative">
                <Icons.MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.telegramLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramLogin: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                  placeholder="@username"
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instagram
              </label>
              <div className="relative">
                <Icons.Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.instagramLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagramLogin: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                  placeholder="username"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                WhatsApp
              </label>
              <div className="relative">
                <Icons.Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.whatsappLogin}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappLogin: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565] disabled:opacity-50"
                  placeholder="+996555123456"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Смена пароля */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Смена пароля
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Текущий пароль
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565]"
                placeholder="Введите текущий пароль"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565]"
                placeholder="Введите новый пароль"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Подтверждение пароля
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 bg-[#151515] border-[#4A5565]"
                placeholder="Повторите новый пароль"
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
                Изменить пароль
              </Button>
            </div>
          </div>
        </div>

        {/* Выход из системы */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Выход из системы
              </h3>
              <p className="text-gray-400">
                Завершить текущую сессию и выйти из аккаунта
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleLogout}
            >
              <Icons.LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}

