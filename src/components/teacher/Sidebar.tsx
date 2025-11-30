'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname()
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Функция для получения перевода с fallback
  const getLabel = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  const menuItems = [
    {
      href: '/',
      icon: Icons.Home,
      labelKey: 'sidebar.dashboard',
      fallback: 'Главная',
    },
    {
      href: '/referrals',
      icon: Icons.Users,
      labelKey: 'sidebar.students',
      fallback: 'Рефералы',
    },
    {
      href: '/tests',
      icon: Icons.FileText,
      labelKey: 'sidebar.tests',
      fallback: 'Тесты',
    },
    {
      href: '/settings',
      icon: Icons.Settings,
      labelKey: 'sidebar.settings',
      fallback: 'Настройки',
    },
  ]

  const handleLinkClick = () => {
    // Закрываем sidebar на мобильных при переходе
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay для мобильных */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-label="Закрыть меню"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 sm:w-72 lg:w-64 bg-[var(--bg-card)] rounded-xl lg:rounded-2xl z-[70]
          transform transition-all duration-300 ease-in-out
          flex-shrink-0 shadow-xl lg:shadow-none overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed top-0 left-0 h-full pt-4 lg:pt-0
          lg:relative lg:h-full
        `}
      >
        {/* Header для мобильных */}
        <div className="lg:hidden flex items-center justify-between px-6 pb-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--text-primary)] rounded-lg flex items-center justify-center">
              <span className="text-[var(--bg-primary)] font-bold text-lg">B</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Меню</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Закрыть меню"
          >
            <Icons.X className="h-5 w-5 text-[var(--text-primary)]" />
          </button>
        </div>

        <nav className="p-4 sm:p-6 space-y-1 sm:space-y-2">
          {menuItems.map((item) => {
            // Для корневого пути проверяем точное совпадение
            // Для остальных путей проверяем, начинается ли pathname с href
            const isActive = item.href === '/' 
              ? pathname === '/' || pathname === ''
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--bg-active-button)] text-[var(--text-active-button)] font-semibold shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">{getLabel(item.labelKey, item.fallback)}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
