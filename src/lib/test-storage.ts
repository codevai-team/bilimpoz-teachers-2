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
    questions.push({ id: questionId, type: questionType })
    localStorage.setItem(key, JSON.stringify(questions))
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
}

