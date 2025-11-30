'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import ThemeToggle from '@/components/ui/ThemeToggle'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const Header: React.FC = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, logout } = useAuth()
  const { t, ready } = useTranslation()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fallback для предотвращения ошибок гидратации
  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    setIsProfileMenuOpen(false)
    await logout()
  }

  // Закрытие меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isProfileMenuOpen && !target.closest('.relative')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileMenuOpen])

  return (
    <header className="bg-[var(--bg-card)] rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl z-50 relative">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
        {/* Левая часть */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Логотип */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--text-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[var(--bg-primary)] font-bold text-base sm:text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">Bilimpoz Teachers</h1>
            </div>
          </div>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
          {/* Переключатель языка */}
          <LanguageSwitcher />

          {/* Переключатель темы */}
          <ThemeToggle />

          {/* Профиль */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Меню профиля"
            >
              {user?.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={user.name || 'Пользователь'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[var(--bg-active)] rounded-full flex items-center justify-center flex-shrink-0">
                  <Icons.User className="h-4 w-4 text-[var(--text-primary)]" />
                </div>
              )}
              <div className="text-left min-w-[80px] sm:min-w-[120px] hidden md:block">
                <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || getText('common.user', 'Пользователь')}</p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {user?.role ? getText(`roles.${user.role}`, 'Преподаватель') : getText('common.roleNotSpecified', 'Роль не указана')}
                </p>
              </div>
              <Icons.ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--text-tertiary)] hidden md:block" />
            </button>

            {/* Выпадающее меню профиля */}
            {isProfileMenuOpen && (
              <>
                {/* Оверлей для закрытия меню на мобильных */}
                <div 
                  className="fixed inset-0 z-40 md:hidden" 
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-xl md:rounded-2xl shadow-2xl py-2 z-50 border border-[var(--border-primary)]">
                  <button 
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--accent-danger)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3"
                  >
                    <Icons.LogOut className="h-4 w-4" />
                    {getText('auth.logout', 'Выйти')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Диалог подтверждения выхода */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        title={getText('auth.confirmLogoutTitle', 'Подтвердите действие')}
        message={getText('auth.confirmLogout', 'Вы уверены, что хотите выйти из системы?')}
        confirmText={getText('auth.logout', 'Выйти')}
        cancelText={getText('common.cancel', 'Отмена')}
        variant="danger"
      />
    </header>
  )
}

export default Header
