'use client'

import React from 'react'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundColor: '#0b0b0b' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Bilimpoz Teachers
          </h1>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}






