'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/ui/Icons'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

interface HeaderProps {
  onMenuToggle: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const handleLogout = async () => {
    if (confirm(t('auth.confirmLogout'))) {
      await logout()
    }
  }

  return (
    <header className="bg-[#151515] rounded-2xl shadow-2xl z-50 relative">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Левая часть */}
        <div className="flex items-center gap-4">
          {/* Кнопка меню (только на мобильных) */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-[#242424] transition-colors"
          >
            <Icons.Menu className="h-5 w-5 text-white" />
          </button>

          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">Bilimpoz Teachers</h1>
            </div>
          </div>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-4">
          {/* Поиск (скрыт на мобильных) */}
          <div className="hidden md:flex items-center relative">
            <Icons.Search className="absolute left-4 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              className="pl-12 pr-4 py-3 bg-[#242424] border-0 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all w-64"
            />
          </div>

          {/* Переключатель языка */}
          <LanguageSwitcher />

          {/* Уведомления */}
          <button className="relative p-2 rounded-lg hover:bg-[#242424] transition-colors">
            <Icons.Bell className="h-5 w-5 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>

          {/* Профиль */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#242424] transition-colors"
            >
              {user?.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={user.name || 'Пользователь'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-[#363636] rounded-full flex items-center justify-center">
                  <Icons.User className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="text-left min-w-[120px]">
                <p className="text-sm font-medium text-white truncate">{user?.name || t('common.user')}</p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.role ? t(`roles.${user.role}`) : t('common.roleNotSpecified')}
                </p>
              </div>
              <Icons.ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Выпадающее меню профиля */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#151515] rounded-2xl shadow-2xl py-2 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#242424] hover:text-white transition-colors flex items-center gap-3">
                  <Icons.User className="h-4 w-4" />
                  {t('header.profile')}
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#242424] hover:text-white transition-colors flex items-center gap-3">
                  <Icons.Settings className="h-4 w-4" />
                  {t('header.settings')}
                </button>
                <hr className="my-2 border-gray-700" />
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#242424] transition-colors flex items-center gap-3"
                >
                  <Icons.LogOut className="h-4 w-4" />
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
