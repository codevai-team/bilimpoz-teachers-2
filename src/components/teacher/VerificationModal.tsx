'use client'

import React from 'react'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuth } from '@/contexts/AuthContext'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onGoToChat: () => void
}

const VerificationModal: React.FC<VerificationModalProps> = ({ isOpen, onClose, onGoToChat }) => {
  const { t, ready } = useTranslation()
  const { logout } = useAuth()

  if (!isOpen) return null

  const getText = (key: string, fallback: string) => {
    if (!ready) return fallback
    return t(key)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-card)] rounded-2xl p-8 max-w-md w-full shadow-xl border border-[var(--border-primary)]">

        {/* Central Content */}
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Icons.MessageCircle className="w-10 h-10 text-[var(--text-primary)]" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            {getText('verification.modal.title', 'Спасибо за регистрацию!')}
          </h2>

          {/* Instructions */}
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {getText('verification.modal.description', 'Осталось пройти верификацию. Напишите администратору платформы для завершения процесса.')}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
        {/* Call to Action Button */}
        <button
          onClick={onGoToChat}
          className="w-full bg-[var(--bg-active-button)] text-[var(--text-active-button)] py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Icons.MessageCircle className="w-5 h-5" />
          <span>{getText('verification.modal.goToChat', 'Перейти в чат')}</span>
        </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Icons.LogOut className="w-5 h-5" />
            <span>{getText('verification.modal.logout', 'Выйти')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerificationModal

