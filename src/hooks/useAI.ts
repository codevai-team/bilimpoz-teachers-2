'use client'

import { useState } from 'react'

interface UseAIReturn {
  improveText: (text: string, language: 'ru' | 'kg') => Promise<string>
  convertImageToLatex: (file: File) => Promise<string>
  isLoading: boolean
  error: string | null
}

export function useAI(): UseAIReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const improveText = async (text: string, language: 'ru' | 'kg'): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          courseLanguage: language
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to improve text')
      }

      const data = await response.json()
      return data.improvedText || text
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const convertImageToLatex = async (file: File): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      // Конвертируем файл в base64
      const base64 = await fileToBase64(file)

      const response = await fetch('/api/ai/image-to-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to convert image to LaTeX')
      }

      const data = await response.json()
      return data.latexCode || ''
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Вспомогательная функция для конвертации файла в base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Убираем префикс "data:image/...;base64,"
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  return {
    improveText,
    convertImageToLatex,
    isLoading,
    error
  }
}
