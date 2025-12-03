import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * PUT /api/teacher/tests/{id}/questions/{questionId}
 * Обновление вопроса в тесте
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
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
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { id: testId, questionId } = await params

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

    // Проверка существования вопроса
    const existingQuestion = await prisma.questions.findUnique({
      where: { id: questionId }
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Вопрос не найден' },
        { status: 404 }
      )
    }

    // Проверка, что вопрос принадлежит этому тесту
    if (existingQuestion.source_id !== testId) {
      return NextResponse.json(
        { success: false, error: 'Вопрос не принадлежит этому тесту' },
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
      explanation_ai
    } = body

    // Валидация
    if (!question || !answerVariants) {
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

    // Удаление старых вариантов ответов
    await prisma.answer_variants.deleteMany({
      where: { question_id: questionId }
    })

    // Определение правильных вариантов
    const correctVariantIds: string[] = []

    // Создание новых вариантов ответов
    for (const variant of validVariants) {
      const createdVariant = await prisma.answer_variants.create({
        data: {
          question_id: questionId,
          value: variant.value.trim()
        }
      })

      if (variant.isCorrect) {
        correctVariantIds.push(createdVariant.id)
      }
    }

    // Обновление вопроса
    const updatedQuestion = await prisma.questions.update({
      where: { id: questionId },
      data: {
        question: question.trim(),
        correct_variants_id: correctVariantIds.join(','),
        photo_url: photoUrl || null,
        points: points || existingQuestion.points,
        time_limit: timeLimit || existingQuestion.time_limit,
        explanation_ai: explanation_ai !== undefined ? explanation_ai : existingQuestion.explanation_ai
      },
      include: {
        answer_variants: {
          orderBy: {
            created_at: 'asc'
          }
        }
      }
    })

    // Форматирование ответа
    const formattedAnswerVariants = updatedQuestion.answer_variants.map(variant => ({
      id: variant.id,
      value: variant.value,
      isCorrect: correctVariantIds.includes(variant.id)
    }))

    return NextResponse.json({
      success: true,
      data: {
        id: updatedQuestion.id,
        question: updatedQuestion.question,
        answerVariants: formattedAnswerVariants,
        photoUrl: updatedQuestion.photo_url || undefined,
        points: updatedQuestion.points,
        timeLimit: updatedQuestion.time_limit,
        type: updatedQuestion.type_question,
        language: updatedQuestion.language,
        explanationAi: updatedQuestion.explanation_ai || undefined
      }
    })
  } catch (error) {
    console.error('Ошибка обновления вопроса:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teacher/tests/{id}/questions/{questionId}
 * Удаление вопроса из теста
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
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
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { id: testId, questionId } = await params

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

    // Проверка существования вопроса
    const existingQuestion = await prisma.questions.findUnique({
      where: { id: questionId }
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Вопрос не найден' },
        { status: 404 }
      )
    }

    // Проверка, что вопрос принадлежит этому тесту
    if (existingQuestion.source_id !== testId) {
      return NextResponse.json(
        { success: false, error: 'Вопрос не принадлежит этому тесту' },
        { status: 403 }
      )
    }

    // Удаление вопроса (каскадное удаление вариантов ответов через БД)
    await prisma.questions.delete({
      where: { id: questionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Вопрос удален'
    })
  } catch (error) {
    console.error('Ошибка удаления вопроса:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}







