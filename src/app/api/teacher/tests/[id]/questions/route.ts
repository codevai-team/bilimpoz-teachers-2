import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/teacher/tests/{id}/questions
 * Получение всех вопросов теста
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Проверка роли
    if (user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const testId = params.id

    // Проверка существования теста
    const test = await prisma.teacher_tests.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Тест не найден' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    if (test.created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получение вопросов теста
    const questions = await prisma.questions.findMany({
      where: {
        source_id: testId,
        type_from: 'from_teacher'
      },
      include: {
        answer_variants: {
          orderBy: {
            created_at: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Форматирование вопросов
    const formattedQuestions = questions.map(question => {
      // Парсинг правильных вариантов
      const correctVariantIds = question.correct_variants_id.split(',').filter(Boolean)
      const answerVariants = question.answer_variants.map((variant, index) => ({
        id: variant.id,
        value: variant.value,
        isCorrect: correctVariantIds.includes(variant.id)
      }))

      return {
        id: question.id,
        question: question.question,
        answerVariants,
        photoUrl: question.photo_url || undefined,
        points: question.points,
        timeLimit: question.time_limit,
        type: question.type_question,
        language: question.language,
        explanationAi: question.explanation_ai || undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedQuestions
    })
  } catch (error) {
    console.error('Ошибка получения вопросов теста:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teacher/tests/{id}/questions?teacherId={teacherId}
 * Создание нового вопроса в тесте
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка аутентификации
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Проверка роли
    if (user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const testId = params.id
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId') || user.id

    // Проверка существования теста
    const test = await prisma.teacher_tests.findUnique({
      where: { id: testId }
    })

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Тест не найден' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    if (test.created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Проверка teacherId
    if (teacherId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Неверный teacherId' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      question,
      answerVariants,
      photoUrl,
      points,
      timeLimit,
      type,
      language,
      explanation_ai
    } = body

    // Валидация
    if (!question || !answerVariants || !type || !language) {
      return NextResponse.json(
        { success: false, error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    if (!Array.isArray(answerVariants) || answerVariants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Необходимо минимум 2 варианта ответа' },
        { status: 400 }
      )
    }

    // Фильтруем пустые варианты
    const validVariants = answerVariants.filter((v: any) => v.value && v.value.trim())
    if (validVariants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Необходимо минимум 2 непустых варианта ответа' },
        { status: 400 }
      )
    }

    // Проверка наличия правильного ответа
    const hasCorrectAnswer = validVariants.some((v: any) => v.isCorrect)
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { success: false, error: 'Необходимо указать хотя бы один правильный ответ' },
        { status: 400 }
      )
    }

    // Определение правильных вариантов
    const correctVariantIds: string[] = []

    // Создание вопроса
    const createdQuestion = await prisma.questions.create({
      data: {
        question: question.trim(),
        correct_variants_id: '', // Временно пустое, заполним после создания вариантов
        photo_url: photoUrl || null,
        type_from: 'from_teacher',
        type_question: type,
        source_id: testId,
        points: points || 1,
        language: language,
        time_limit: timeLimit || 60,
        explanation_ai: explanation_ai || null
      }
    })

    // Создание вариантов ответов
    for (const variant of validVariants) {
      const createdVariant = await prisma.answer_variants.create({
        data: {
          question_id: createdQuestion.id,
          value: variant.value.trim()
        }
      })

      if (variant.isCorrect) {
        correctVariantIds.push(createdVariant.id)
      }
    }

    // Обновление вопроса с правильными вариантами
    await prisma.questions.update({
      where: { id: createdQuestion.id },
      data: {
        correct_variants_id: correctVariantIds.join(',')
      }
    })

    // Получение созданного вопроса с вариантами
    const questionWithVariants = await prisma.questions.findUnique({
      where: { id: createdQuestion.id },
      include: {
        answer_variants: {
          orderBy: {
            created_at: 'asc'
          }
        }
      }
    })

    if (!questionWithVariants) {
      return NextResponse.json(
        { success: false, error: 'Ошибка при создании вопроса' },
        { status: 500 }
      )
    }

    // Форматирование ответа
    const formattedAnswerVariants = questionWithVariants.answer_variants.map(variant => ({
      id: variant.id,
      value: variant.value,
      isCorrect: correctVariantIds.includes(variant.id)
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: questionWithVariants.id,
        question: questionWithVariants.question,
        answerVariants: formattedAnswerVariants,
        photoUrl: questionWithVariants.photo_url || undefined,
        points: questionWithVariants.points,
        timeLimit: questionWithVariants.time_limit,
        type: questionWithVariants.type_question,
        language: questionWithVariants.language,
        explanationAi: questionWithVariants.explanation_ai || undefined
      }
    })
  } catch (error) {
    console.error('Ошибка создания вопроса:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}







