'use client'

import { useState } from 'react'

export default function TelegramAdminPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handlePollingControl = async (action: 'start' | 'stop') => {
    setLoading(true)
    try {
      const response = await fetch('/api/telegram/polling-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      setStatus(`${action === 'start' ? 'Запуск' : 'Остановка'}: ${result.message}`)
    } catch (error) {
      setStatus(`Ошибка: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleForceClear = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/telegram/force-clear', {
        method: 'POST'
      })
      
      const result = await response.json()
      setStatus(`Принудительная очистка: ${result.message}`)
    } catch (error) {
      setStatus(`Ошибка очистки: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/telegram/polling-status')
      const result = await response.json()
      setStatus(`Статус: ${result.isActive ? 'Активен' : 'Неактивен'}`)
    } catch (error) {
      setStatus(`Ошибка проверки: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Управление Telegram Polling</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => handlePollingControl('start')}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Запустить Polling
          </button>
          
          <button
            onClick={() => handlePollingControl('stop')}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Остановить Polling
          </button>
          
          <button
            onClick={checkStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Проверить статус
          </button>
        </div>
        
        <button
          onClick={handleForceClear}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Принудительная очистка конфликтов
        </button>
        
        {status && (
          <div className="p-4 bg-gray-100 rounded">
            <pre className="text-sm">{status}</pre>
          </div>
        )}
        
        {loading && (
          <div className="text-blue-500">Загрузка...</div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Инструкции:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Если есть конфликты, сначала нажмите "Принудительная очистка конфликтов"</li>
          <li>Подождите 5-10 секунд</li>
          <li>Нажмите "Запустить Polling"</li>
          <li>Проверьте статус</li>
        </ol>
      </div>
    </div>
  )
}
