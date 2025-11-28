import { getOpenAIApiKey, getOpenAIModel } from './settings'
import { getImproveTextPrompt } from './prompts'

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

    // Получаем промпт из базы данных
    const promptTemplate = await getImproveTextPrompt(language)
    
    // Подставляем текст в промпт (заменяем плейсхолдер {text})
    const prompt = promptTemplate.replace('{text}', text)

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

    const prompt = `Это изображение содержит математическую формулу или уравнение. Конвертируй его в корректный LaTeX код.

ВАЖНЫЕ ТРЕБОВАНИЯ:
1. Для дробей ВСЕГДА используй команду \\frac{числитель}{знаменатель}
2. Убедись, что ВСЕ цифры и символы в числителе и знаменателе дробей полностью видны и правильно распознаны
3. Если в дроби есть многочлены или сложные выражения, используй фигурные скобки {} для группировки
4. Для индексов используй нижний индекс: x_{n}, для степеней - верхний: x^{n}
5. Для корней используй \\sqrt[n]{выражение} для корня n-й степени или \\sqrt{выражение} для квадратного корня
6. Верни только чистый LaTeX код без дополнительных комментариев, обернутый в блок формулы (используй $$ для блочной формулы или $ для инлайн формулы, в зависимости от содержимого)
7. Проверь, что все символы, цифры и операторы правильно распознаны и отображены

Примеры правильных дробей:
- Простая дробь: \\frac{1}{2}
- Дробь с многочленом: \\frac{x+1}{x-2}
- Сложная дробь: \\frac{a^{2}+b^{2}}{c^{3}-d^{3}}`

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
              content: 'Ты - эксперт по LaTeX и математическим формулам. Твоя задача - точно конвертировать изображения с математическими формулами в корректный LaTeX код. Особое внимание уделяй правильному распознаванию всех элементов дробей, включая все цифры в числителе и знаменателе.'
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
          temperature: 0.2,
          max_tokens: 1000
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
      
      // Убираем лишние пробелы и переносы строк внутри формул
      latexCode = latexCode.replace(/\s+/g, ' ').trim()
      
      // Исправляем распространенные ошибки с дробями
      // Исправляем неправильные дроби вида a/b на \frac{a}{b}
      latexCode = latexCode.replace(/(\d+|[a-zA-Z]+\^?\{?[^}]*\}?)\s*\/\s*(\d+|[a-zA-Z]+\^?\{?[^}]*\}?)/g, (match, num, den) => {
        // Проверяем, не является ли это уже частью \frac
        if (match.includes('\\frac')) return match
        // Убираем лишние пробелы
        num = num.trim()
        den = den.trim()
        return `\\frac{${num}}{${den}}`
      })
      
      // Исправляем дроби без фигурных скобок: \frac a b -> \frac{a}{b}
      latexCode = latexCode.replace(/\\frac\s+([^{}\s]+)\s+([^{}\s]+)/g, (match, num, den) => {
        return `\\frac{${num}}{${den}}`
      })
      
      // Исправляем незакрытые фигурные скобки в дробях
      latexCode = latexCode.replace(/\\frac\{([^}]+)\s+([^}]+)\}/g, (match, num, den) => {
        // Если в числителе или знаменателе есть пробелы, но нет скобок, добавляем их
        if (num.includes(' ') && !num.startsWith('{')) {
          num = `{${num}}`
        }
        if (den.includes(' ') && !den.startsWith('{')) {
          den = `{${den}}`
        }
        return `\\frac{${num}}{${den}}`
      })
      
      // Исправляем дроби с неправильной структурой: \frac{num den} -> \frac{num}{den}
      // (это обрабатывается предыдущим regex, но оставляем для дополнительной проверки)
      
      // Проверяем и исправляем баланс фигурных скобок в \frac
      const fracRegex = /\\frac\{([^}]*)\}\{([^}]*)\}/g
      latexCode = latexCode.replace(fracRegex, (match, num, den) => {
        // Убеждаемся, что числитель и знаменатель не пустые
        if (!num || !den) {
          console.warn('Обнаружена пустая дробь:', match)
          return match
        }
        // Убираем лишние пробелы
        num = num.trim()
        den = den.trim()
        return `\\frac{${num}}{${den}}`
      })
      
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

  /**
   * Генерация объяснения для вопроса с использованием промпта из БД
   */
  async explainQuestion(
    questionData: {
      question: string
      answers: Array<{ value: string; isCorrect: boolean }>
      imageUrl?: string
    },
    courseLanguage: 'kg' | 'ru',
    testType: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard',
    promptText: string
  ): Promise<string> {
    if (!this.apiKey) {
      await this.initialize()
    }

    // Формируем список ответов с пометкой правильного
    const answersText = questionData.answers
      .map((answer, index) => {
        const label = String.fromCharCode(1040 + index) // А, Б, В, Г, Д
        const correctMark = answer.isCorrect ? ' (правильный ответ)' : ''
        return `${label}) ${answer.value}${correctMark}`
      })
      .join('\n')

    // Формируем полный промпт, подставляя данные вопроса
    // Поддерживаем различные варианты плейсхолдеров (глобальная замена)
    let fullPrompt = promptText
      .replace(/\{question\}/g, questionData.question)
      .replace(/\{answers\}/g, answersText)
      .replace(/\{language\}/g, courseLanguage === 'kg' ? 'кыргызский' : 'русский')
      .replace(/\{correctAnswer\}/g, questionData.answers.find(a => a.isCorrect)?.value || 'не указан')

    // Если есть изображение, используем vision модель
    const hasImage = questionData.imageUrl && questionData.imageUrl.trim() !== ''
    
    try {
      const messages: any[] = [
        {
          role: 'system',
          content: 'Ты - помощник для объяснения учебных вопросов. Твоя задача - давать понятные и структурированные объяснения в формате Markdown. Используй Markdown для форматирования текста (жирный, курсив, списки, заголовки) и LaTeX для математических формул (инлайн формулы через $...$ и блочные через $$...$$). Объяснение должно быть хорошо структурированным и читаемым.'
        }
      ]

      if (hasImage && this.isVisionModel(this.model)) {
        // Если есть изображение и модель поддерживает vision
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: fullPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: questionData.imageUrl
              }
            }
          ]
        })
      } else {
        // Обычный текстовый запрос
        messages.push({
          role: 'user',
          content: fullPrompt
        })
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      let explanation = data.choices?.[0]?.message?.content?.trim()

      if (!explanation) {
        throw new Error('Пустой ответ от OpenAI API')
      }

      // Убираем markdown код-блоки, если AI их добавил (например, ```markdown ... ```)
      explanation = explanation.replace(/^```markdown\n?/i, '').replace(/^```\n?/g, '').replace(/\n?```$/g, '').trim()

      return explanation
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
}

// Экспортируем singleton экземпляр
export const openAIService = new OpenAIService()

