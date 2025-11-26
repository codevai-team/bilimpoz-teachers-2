'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface PasswordTestResult {
  found: boolean
  message?: string
  user?: {
    id: string
    name: string
    login: string
    role: string
    status: string
  }
  passwordTests?: {
    usingVerifyPassword: boolean
    usingBcryptDirectly: boolean
    usingPlainComparison: boolean
  }
}

export default function DebugPasswordPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<PasswordTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testPassword = async () => {
    if (!login || !password) return

    setLoading(true)
    try {
      const response = await fetch('/api/debug/test-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error testing password:', error)
      setResult({
        found: false,
        message: 'Ошибка сети'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-[#0b0b0b] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Тест пароля</h1>
      
      <div className="bg-[#151515] rounded-lg p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Логин</label>
            <Input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
            />
          </div>
          
          <Button
            onClick={testPassword}
            disabled={!login || !password || loading}
            className="w-full"
          >
            {loading ? 'Тестирование...' : 'Тестировать пароль'}
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-[#151515] rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-bold mb-4">Результат теста</h2>
          
          {!result.found ? (
            <div className="text-red-400">
              {result.message || 'Пользователь не найден'}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Пользователь найден</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <div>ID: {result.user?.id}</div>
                  <div>Имя: {result.user?.name}</div>
                  <div>Логин: {result.user?.login}</div>
                  <div>Роль: {result.user?.role}</div>
                  <div>Статус: {result.user?.status}</div>
                </div>
              </div>
              
              {result.passwordTests && (
                <div>
                  <h3 className="font-semibold mb-2">Тесты пароля</h3>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${
                      result.passwordTests.usingVerifyPassword ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span>{result.passwordTests.usingVerifyPassword ? '✓' : '✗'}</span>
                      <span>verifyPassword(): {result.passwordTests.usingVerifyPassword.toString()}</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${
                      result.passwordTests.usingBcryptDirectly ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span>{result.passwordTests.usingBcryptDirectly ? '✓' : '✗'}</span>
                      <span>bcrypt.compare(): {result.passwordTests.usingBcryptDirectly.toString()}</span>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${
                      result.passwordTests.usingPlainComparison ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span>{result.passwordTests.usingPlainComparison ? '✓' : '✗'}</span>
                      <span>Прямое сравнение: {result.passwordTests.usingPlainComparison.toString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


