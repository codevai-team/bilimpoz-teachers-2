'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname()

  const menuItems = [
    {
      href: '/',
      icon: Icons.Home,
      label: 'Главная',
    },
    {
      href: '/students',
      icon: Icons.Users,
      label: 'Ученики',
    },
    {
      href: '/questions',
      icon: Icons.HelpCircle,
      label: 'Вопросы',
    },
    {
      href: '/discussions',
      icon: Icons.MessageCircle,
      label: 'Обсуждения',
    },
    {
      href: '/settings',
      icon: Icons.Settings,
      label: 'Настройки',
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
          w-64 bg-[#151515] rounded-2xl z-40
          transform transition-transform duration-300
          flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed top-0 left-0 h-full
          lg:relative lg:h-auto
        `}
      >
        <nav className="p-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-gray-400 hover:bg-[#242424] hover:text-white'
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
