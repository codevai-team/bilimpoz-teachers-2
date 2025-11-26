/**
 * Утилиты для работы с localStorage для тестов и вопросов
 */

// Типы
export interface DraftTest {
  id: string
  name: string
  description: string
  language: 'ru' | 'kg'
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  teacherId: string
  section?: 'math1' | 'math2' | 'analogy' | 'rac' | 'grammar' | 'standard'
}

export interface QuestionData {
  question: string
  answers: Array<{ id?: string; value: string; isCorrect: boolean }>
  points: number
  timeLimit: number
  imageUrl?: string
  language?: 'ru' | 'kg'
  lastModified?: number
  version?: number
  textRac?: string // Для типа RAC
  answerA?: string // Для типа Math1
  answerB?: string // Для типа Math1
  explanation_ai?: string // AI объяснение
  textVersions?: {
    question?: { original: string; improved: string; isShowingImproved: boolean }
    answers?: Record<number, { original: string; improved: string; isShowingImproved: boolean }>
  }
}

export type QuestionType = 'standard' | 'analogy' | 'grammar' | 'math1' | 'math2' | 'rac'

// Ключи localStorage
const DRAFT_TESTS_KEY = 'teacher_tests_draft'
const TEST_STATUSES_KEY = 'test_statuses'
const TEST_QUESTIONS_PREFIX = 'testQuestions_'
const QUESTION_DATA_PREFIX = {
  standard: 'TestStandard_',
  analogy: 'TestAnalogy_',
  grammar: 'TestGrammar_',
  math1: 'TestMath1_',
  math2: 'TestMath2_',
  rac: 'TestRac_'
}

/**
 * Генерация временного ID
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Проверка, является ли ID временным
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp-')
}

// ========== Работа с черновиками тестов ==========

/**
 * Сохранение черновика теста
 */
export function saveDraftTest(test: DraftTest): void {
  try {
    const existing = getDraftTests()
    existing[test.id] = test
    localStorage.setItem(DRAFT_TESTS_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Ошибка сохранения черновика теста:', error)
  }
}

/**
 * Получение черновика теста
 */
export function getDraftTest(testId: string): DraftTest | null {
  try {
    const tests = getDraftTests()
    return tests[testId] || null
  } catch (error) {
    console.error('Ошибка получения черновика теста:', error)
    return null
  }
}

/**
 * Получение всех черновиков тестов
 */
export function getDraftTests(): Record<string, DraftTest> {
  try {
    const data = localStorage.getItem(DRAFT_TESTS_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Ошибка получения черновиков тестов:', error)
    return {}
  }
}

/**
 * Удаление черновика теста
 */
export function removeDraftTest(testId: string): void {
  try {
    const tests = getDraftTests()
    delete tests[testId]
    localStorage.setItem(DRAFT_TESTS_KEY, JSON.stringify(tests))
  } catch (error) {
    console.error('Ошибка удаления черновика теста:', error)
  }
}

// ========== Работа со статусами тестов ==========

/**
 * Установка статуса теста
 */
export function setTestStatus(testId: string, status: 'draft' | 'published'): void {
  try {
    const statuses = getTestStatuses()
    statuses[testId] = status
    localStorage.setItem(TEST_STATUSES_KEY, JSON.stringify(statuses))
  } catch (error) {
    console.error('Ошибка установки статуса теста:', error)
  }
}

/**
 * Получение статуса теста
 */
export function getTestStatus(testId: string): 'draft' | 'published' | null {
  try {
    const statuses = getTestStatuses()
    return statuses[testId] || null
  } catch (error) {
    console.error('Ошибка получения статуса теста:', error)
    return null
  }
}

/**
 * Получение всех статусов тестов
 */
export function getTestStatuses(): Record<string, 'draft' | 'published'> {
  try {
    const data = localStorage.getItem(TEST_STATUSES_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Ошибка получения статусов тестов:', error)
    return {}
  }
}

/**
 * Удаление статуса теста
 */
export function removeTestStatus(testId: string): void {
  try {
    const statuses = getTestStatuses()
    delete statuses[testId]
    localStorage.setItem(TEST_STATUSES_KEY, JSON.stringify(statuses))
  } catch (error) {
    console.error('Ошибка удаления статуса теста:', error)
  }
}

// ========== Работа с вопросами теста ==========

/**
 * Добавление вопроса к тесту (черновик)
 */
export function addQuestionToTestDraft(testId: string, questionId: string, questionType: QuestionType): void {
  try {
    const key = `${TEST_QUESTIONS_PREFIX}${testId}`
    const questions = getTestQuestions(testId)
    
    // Проверяем, есть ли уже такой вопрос в списке
    const existingQuestion = questions.find(q => q.id === questionId)
    if (existingQuestion) {
      console.log(`Вопрос ${questionId} уже существует в тесте ${testId}, пропускаем добавление`)
      return
    }
    
    questions.push({ id: questionId, type: questionType })
    localStorage.setItem(key, JSON.stringify(questions))
    console.log(`Добавлен вопрос ${questionId} в тест ${testId}`)
  } catch (error) {
    console.error('Ошибка добавления вопроса к тесту:', error)
  }
}

/**
 * Добавление вопроса к тесту (алиас для обратной совместимости)
 */
export function addQuestionToTest(testId: string, questionId: string, questionType: QuestionType): void {
  return addQuestionToTestDraft(testId, questionId, questionType)
}

/**
 * Получение всех вопросов теста
 */
export function getTestQuestions(testId: string): Array<{ id: string; type: QuestionType }> {
  try {
    const key = `${TEST_QUESTIONS_PREFIX}${testId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Ошибка получения вопросов теста:', error)
    return []
  }
}

/**
 * Удаление вопроса из теста
 */
export function removeQuestionFromTest(testId: string, questionId: string): void {
  try {
    const questions = getTestQuestions(testId)
    const filtered = questions.filter(q => q.id !== questionId)
    const key = `${TEST_QUESTIONS_PREFIX}${testId}`
    localStorage.setItem(key, JSON.stringify(filtered))
  } catch (error) {
    console.error('Ошибка удаления вопроса из теста:', error)
  }
}

/**
 * Удаление всех вопросов теста
 */
export function removeTestQuestions(testId: string): void {
  try {
    const key = `${TEST_QUESTIONS_PREFIX}${testId}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Ошибка удаления вопросов теста:', error)
  }
}

/**
 * Очистка дубликатов вопросов в тесте
 */
export function removeDuplicateQuestions(testId: string): void {
  try {
    const questions = getTestQuestions(testId)
    const uniqueQuestions = questions.filter((question, index, self) => 
      index === self.findIndex(q => q.id === question.id)
    )
    
    if (uniqueQuestions.length !== questions.length) {
      console.log(`Найдено ${questions.length - uniqueQuestions.length} дубликатов в тесте ${testId}, очищаем...`)
      const key = `${TEST_QUESTIONS_PREFIX}${testId}`
      localStorage.setItem(key, JSON.stringify(uniqueQuestions))
    }
  } catch (error) {
    console.error('Ошибка очистки дубликатов вопросов:', error)
  }
}

/**
 * Определяем минимальное количество ответов в зависимости от типа вопроса
 */
export function getMinAnswersCountForType(type: string): number {
  if (type === 'math1') {
    return 2
  }
  if (type === 'math2') {
    return 5
  }
  return 2 // analogy, rac, grammar, standard - минимум 2
}

/**
 * Определяем максимальное количество ответов в зависимости от типа вопроса
 */
export function getMaxAnswersCountForType(type: string): number {
  if (type === 'math1') {
    return 2 // Строго 2 ответа
  }
  if (type === 'math2') {
    return 5 // Строго 5 ответов
  }
  if (type === 'analogy' || type === 'rac' || type === 'grammar') {
    return 4 // Строго 4 ответа
  }
  return 10 // standard - до 10 ответов
}

/**
 * Получение временных вопросов (созданных пользователем, но не сохраненных в БД)
 */
export function getTempQuestions(testId: string): Array<{ id: string; type: QuestionType; data: QuestionData }> {
  try {
    const questions = getTestQuestions(testId)
    const tempQuestions: Array<{ id: string; type: QuestionType; data: QuestionData }> = []
    
    for (const question of questions) {
      if (isTempId(question.id)) {
        const data = loadQuestionDraft(question.id, question.type)
        if (data) {
          tempQuestions.push({
            id: question.id,
            type: question.type,
            data
          })
        }
      }
    }
    
    console.log(`Найдено ${tempQuestions.length} временных вопросов для теста ${testId}`)
    return tempQuestions
  } catch (error) {
    console.error('Ошибка получения временных вопросов:', error)
    return []
  }
}

/**
 * Очистка только сохраненных вопросов (не временных)
 */
export function clearSavedQuestionsFromLocalStorage(testId: string): void {
  try {
    console.log(`Очистка сохраненных вопросов теста ${testId} из localStorage`)
    
    // Получаем все вопросы теста
    const questions = getTestQuestions(testId)
    
    // Удаляем только НЕ временные вопросы
    for (const question of questions) {
      if (!isTempId(question.id)) {
        removeQuestionDraft(question.id, question.type)
      }
    }
    
    // Обновляем список вопросов, оставляя только временные
    const tempQuestions = questions.filter(q => isTempId(q.id))
    const key = `${TEST_QUESTIONS_PREFIX}${testId}`
    localStorage.setItem(key, JSON.stringify(tempQuestions))
    
    console.log(`Очищено ${questions.length - tempQuestions.length} сохраненных вопросов, оставлено ${tempQuestions.length} временных`)
  } catch (error) {
    console.error('Ошибка очистки сохраненных вопросов:', error)
  }
}

/**
 * Полная очистка всех данных теста из localStorage
 */
export function clearTestFromLocalStorage(testId: string): void {
  try {
    console.log(`Полная очистка теста ${testId} из localStorage`)
    
    // Получаем все вопросы теста
    const questions = getTestQuestions(testId)
    
    // Удаляем данные каждого вопроса
    for (const question of questions) {
      removeQuestionDraft(question.id, question.type)
    }
    
    // Удаляем список вопросов теста
    removeTestQuestions(testId)
    
    console.log(`Очищено ${questions.length} вопросов для теста ${testId}`)
  } catch (error) {
    console.error('Ошибка полной очистки теста:', error)
  }
}

// ========== Работа с данными вопросов ==========

/**
 * Сохранение данных вопроса (черновик)
 */
export function saveQuestionDraft(questionId: string, questionType: QuestionType, data: QuestionData): void {
  try {
    const key = `${QUESTION_DATA_PREFIX[questionType]}${questionId}`
    const questionData = {
      ...data,
      lastModified: Date.now(),
      version: (data.version || 0) + 1
    }
    localStorage.setItem(key, JSON.stringify(questionData))
  } catch (error) {
    console.error('Ошибка сохранения данных вопроса:', error)
  }
}

/**
 * Сохранение данных вопроса (алиас)
 */
export function saveQuestionData(questionId: string, data: QuestionData, questionType: QuestionType): void {
  return saveQuestionDraft(questionId, questionType, data)
}

/**
 * Загрузка данных вопроса (черновик)
 */
export function loadQuestionDraft(questionId: string, questionType: QuestionType): QuestionData | null {
  try {
    const key = `${QUESTION_DATA_PREFIX[questionType]}${questionId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Ошибка загрузки данных вопроса:', error)
    return null
  }
}

/**
 * Загрузка данных вопроса (алиас)
 */
export function loadQuestionData(questionId: string, questionType: QuestionType): QuestionData | null {
  return loadQuestionDraft(questionId, questionType)
}

/**
 * Удаление данных вопроса (черновик)
 */
export function removeQuestionDraft(questionId: string, questionType: QuestionType): void {
  try {
    const key = `${QUESTION_DATA_PREFIX[questionType]}${questionId}`
    localStorage.removeItem(key)
    // Также удаляем из списка вопросов всех тестов
    removeQuestionFromAllTests(questionId)
  } catch (error) {
    console.error('Ошибка удаления данных вопроса:', error)
  }
}

/**
 * Удаление данных вопроса (алиас)
 */
export function removeQuestionData(questionId: string, questionType: QuestionType): void {
  return removeQuestionDraft(questionId, questionType)
}

/**
 * Удаление вопроса из всех тестов
 */
function removeQuestionFromAllTests(questionId: string): void {
  try {
    const keys = Object.keys(localStorage)
    const testQuestionKeys = keys.filter(key => key.startsWith(TEST_QUESTIONS_PREFIX))
    
    testQuestionKeys.forEach(key => {
      const data = localStorage.getItem(key)
      if (data) {
        const questions = JSON.parse(data)
        const filtered = questions.filter((q: any) => q.id !== questionId)
        localStorage.setItem(key, JSON.stringify(filtered))
      }
    })
  } catch (error) {
    console.error('Ошибка удаления вопроса из тестов:', error)
  }
}

/**
 * Класс для удобной работы с localStorage
 */
export class TestLocalStorage {
  static save(questionId: string, data: QuestionData, questionType: QuestionType): void {
    saveQuestionData(questionId, data, questionType)
  }

  static load(questionId: string, questionType: QuestionType): QuestionData | null {
    return loadQuestionData(questionId, questionType)
  }

  static remove(questionId: string, questionType: QuestionType): void {
    removeQuestionData(questionId, questionType)
  }

  static getTestQuestions(testId: string): Array<{ id: string; type: QuestionType }> {
    return getTestQuestions(testId)
  }

  static addQuestionToTest(testId: string, questionId: string, questionType: QuestionType): void {
    addQuestionToTest(testId, questionId, questionType)
  }

  static removeTestQuestions(testId: string): void {
    removeTestQuestions(testId)
  }

  static saveTestQuestions(testId: string, questionIds: Array<{ id: string; type: QuestionType }>): void {
    try {
      const key = `${TEST_QUESTIONS_PREFIX}${testId}`
      localStorage.setItem(key, JSON.stringify(questionIds))
    } catch (error) {
      console.error('Ошибка сохранения списка вопросов теста:', error)
    }
  }

  static removeDuplicateQuestions(testId: string): void {
    removeDuplicateQuestions(testId)
  }
}

