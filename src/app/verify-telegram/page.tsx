'use client'

import React from 'react'
import TelegramVerificationForm from '@/components/auth/TelegramVerificationForm'

export default function VerifyTelegramPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6 sm:p-4 overflow-auto"
      style={{ backgroundColor: '#0b0b0b' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#0b0b0b] font-bold text-xl sm:text-2xl">B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bilimpoz Teachers
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Подтверждение входа через Telegram
          </p>
        </div>
        <TelegramVerificationForm />
      </div>
    </div>
  )
}
