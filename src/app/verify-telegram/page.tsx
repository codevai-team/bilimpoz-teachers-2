'use client'

import React from 'react'
import TelegramVerificationForm from '@/components/auth/TelegramVerificationForm'

export default function VerifyTelegramPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundColor: '#0b0b0b' }}
    >
      <div className="w-full max-w-md">
        <TelegramVerificationForm />
      </div>
    </div>
  )
}



