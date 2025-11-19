import { getOpenAIApiKey, getOpenAIModel } from './settings'

/**
 * Сервис для работы с OpenAI API
 */
export class OpenAIService {
  private apiKey: string | null = null
  private model: string = 'gpt-4o-mini'

  /**
   * Инициализация сервиса (получение настроек из БД)
   */
  async initialize(): Promise<void> {
    this.apiKey = await getOpenAIApiKey()
    this.model = await getOpenAIModel()

    if (!this.apiKey) {
      throw new Error('OpenAI API key не найден в настройках. Установите OPENAI_API_KEY в таблице settings.')
    }
  }

  /**
   * Улучшение текста с помощью AI
   */
  async improveText(text: string, language: 'kg' | 'ru'): Promise<string> {
    if (!this.apiKey) {
      await this.initialize()
    }

    const languageName = language === 'kg' ? 'кыргызский' : 'русский'
    
    const prompt = `Ты - помощник для улучшения образовательных текстов. Улучши следующий текст на ${languageName} языке, сделав его более понятным, структурированным и подходящим для учебных материалов. Сохрани основную мысль и смысл, но улучши формулировки, грамматику и стиль.

Текст для улучшения:
${text}

Верни только улучшенный текст без дополнительных комментариев.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Ты - помощник для улучшения образовательных текстов. Твоя задача - улучшать тексты, делая их более понятными и структурированными, сохраняя при этом основную мысль.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const improvedText = data.choices?.[0]?.message?.content?.trim()

      if (!improvedText) {
        throw new Error('Пустой ответ от OpenAI API')
      }

      return improvedText
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key не настроен или неверен. Проверьте настройки OPENAI_API_KEY в таблице settings.')
        }
        throw error
      }
      throw new Error('Ошибка при обращении к OpenAI API')
    }
  }

  /**
   * Проверка, поддерживает ли модель обработку изображений
   */
  private isVisionModel(model: string): boolean {
    const visionModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-vision-preview', 'gpt-4-1106-vision-preview']
    return visionModels.some(vm => model.includes(vm) || model.startsWith(vm))
  }

  /**
   * Конвертация изображения в LaTeX код
   */
  async convertImageToLatex(imageBase64: string): Promise<string> {
    if (!this.apiKey) {
      await this.initialize()
    }

    // Проверяем поддержку vision
    if (!this.isVisionModel(this.model)) {
      throw new Error(`Модель ${this.model} не поддерживает обработку изображений. Используйте модель с поддержкой vision (например, gpt-4o, gpt-4o-mini, gpt-4-turbo).`)
    }

    const prompt = `Это изображение содержит математическую формулу или уравнение. Конвертируй его в корректный LaTeX код. Верни только LaTeX код без дополнительных комментариев, обернутый в блок формулы (используй $$ для блочной формулы или $ для инлайн формулы, в зависимости от содержимого).`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Ты - эксперт по LaTeX. Твоя задача - конвертировать изображения с математическими формулами в корректный LaTeX код.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      let latexCode = data.choices?.[0]?.message?.content?.trim()

      if (!latexCode) {
        throw new Error('Пустой ответ от OpenAI API')
      }

      // Убираем markdown код блоки, если они есть
      latexCode = latexCode.replace(/```latex\n?/g, '').replace(/```\n?/g, '').trim()
      
      // Если код не обернут в $$, добавляем
      if (!latexCode.startsWith('$$') && !latexCode.startsWith('$')) {
        latexCode = `$$${latexCode}$$`
      }

      return latexCode
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key не настроен или неверен. Проверьте настройки OPENAI_API_KEY в таблице settings.')
        }
        if (error.message.includes('vision') || error.message.includes('image')) {
          throw new Error('Модель не поддерживает обработку изображений. Используйте модель с поддержкой vision (например, gpt-4o, gpt-4o-mini, gpt-4-turbo).')
        }
        throw error
      }
      throw new Error('Ошибка при обращении к OpenAI API')
    }
  }
}

// Экспортируем singleton экземпляр
export const openAIService = new OpenAIService()

