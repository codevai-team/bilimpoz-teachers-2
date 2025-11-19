'use client'

import React from 'react'
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

  // Функция для получения перевода с fallback
  const getLabel = (key: string, fallback: string) => {
    if (!ready) return fallback
    const translation = t(key)
    return translation === key ? fallback : translation
  }

  const menuItems = [
    {
      href: '/',
      icon: Icons.Home,
      label: getLabel('sidebar.dashboard', 'Главная'),
    },
    {
      href: '/students',
      icon: Icons.Users,
      label: getLabel('sidebar.students', 'Ученики'),
    },
    {
      href: '/tests',
      icon: Icons.FileText,
      label: getLabel('sidebar.tests', 'Тесты'),
    },
    {
      href: '/questions',
      icon: Icons.HelpCircle,
      label: getLabel('sidebar.questions', 'Вопросы'),
    },
    {
      href: '/discussions',
      icon: Icons.MessageCircle,
      label: getLabel('sidebar.discussions', 'Обсуждения'),
    },
    {
      href: '/settings',
      icon: Icons.Settings,
      label: getLabel('sidebar.settings', 'Настройки'),
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
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-[var(--bg-card)] rounded-2xl z-40
          transform transition-transform duration-300
          flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed top-0 left-0 h-full
          lg:relative lg:h-auto lg:block
        `}
      >
        <nav className="p-6 space-y-2">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[var(--bg-active-button)] text-[var(--text-active-button)] font-semibold'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
