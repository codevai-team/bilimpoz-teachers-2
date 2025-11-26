'use client'

import { useState, useEffect } from 'react'
import { useAI } from '@/hooks/useAI'

export default function TestAIPage() {
  const [text, setText] = useState('Привет мир')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [aiSettings, setAiSettings] = useState<any>(null)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [isSaving, setIsSaving] = useState(false)
  const { improveText, convertImageToLatex, isLoading } = useAI()

  // Загружаем настройки AI при монтировании
  useEffect(() => {
    fetch('/api/debug/ai-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAiSettings(data.data)
        } else {
          setError(data.error)
        }
      })
      .catch(err => setError(err.message))
  }, [])

  const handleImproveText = async () => {
    try {
      setError('')
      const improved = await improveText(text, 'ru')
      setResult(improved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError('')
      const latex = await convertImageToLatex(file)
      setResult(latex)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleSaveSettings = async () => {
    if (!apiKey.trim()) {
      setError('API ключ не может быть пустым')
      return
    }

    setIsSaving(true)
    try {
      setError('')
      const response = await fetch('/api/debug/set-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: model.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        setResult('Настройки AI успешно сохранены!')
        // Перезагружаем настройки
        const settingsResponse = await fetch('/api/debug/ai-settings')
        const settingsData = await settingsResponse.json()
        if (settingsData.success) {
          setAiSettings(settingsData.data)
        }
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Тест AI функций</h1>
      
      <div className="space-y-6">
        {/* Информация о настройках AI */}
        {aiSettings && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Настройки AI</h2>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p><strong>API ключ:</strong> {aiSettings.hasApiKey ? '✅ Настроен' : '❌ Не настроен'}</p>
              {aiSettings.hasApiKey && (
                <>
                  <p><strong>Длина ключа:</strong> {aiSettings.apiKeyLength} символов</p>
                  <p><strong>Превью ключа:</strong> {aiSettings.apiKeyPreview}</p>
                </>
              )}
              <p><strong>Модель:</strong> {aiSettings.model}</p>
            </div>
          </div>
        )}

        {/* Настройка API ключа */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Настройка OpenAI API</h2>
          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Введите OpenAI API ключ (sk-...)"
            />
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Модель (например: gpt-4o-mini)"
            />
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>

        {/* Тест улучшения текста */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Улучшение текста</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder="Введите текст для улучшения"
          />
          <button
            onClick={handleImproveText}
            disabled={isLoading}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Обработка...' : 'Улучшить текст'}
          </button>
        </div>

        {/* Тест конвертации изображения */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Конвертация изображения в LaTeX</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Результат */}
        {result && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Результат:</h3>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">Ошибка:</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
