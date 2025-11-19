import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    
    // Получаем только вопросы, которые создал этот учитель
    // Фильтруем по type_from = 'from_teacher' и source_id = user.id
    const questions = await prisma.questions.findMany({
      where: {
        type_from: 'from_teacher',
        source_id: user.id
      },
      include: {
        answer_variants: {
          orderBy: {
            created_at: 'asc'
          }
        },
        _count: {
          select: {
            passed_questions: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Получаем жалобы для вопросов
    const questionIds = questions.map(q => q.id)
    const complaints = await prisma.complaints.findMany({
      where: {
        source_id: {
          in: questionIds
        },
        type: 'teacher_question',
        status: 'created'
      },
      select: {
        source_id: true
      }
    })

    const complaintQuestionIds = new Set(complaints.map(c => c.source_id))

    // Получаем статистику правильных ответов
    const passedQuestions = await prisma.passed_questions.findMany({
      where: {
        question_id: {
          in: questionIds
        },
        status: 'correct'
      },
      select: {
        question_id: true
      }
    })

    // Подсчитываем процент правильных ответов для каждого вопроса
    const correctCounts = new Map<string, number>()
    const totalCounts = new Map<string, number>()

    passedQuestions.forEach(pq => {
      correctCounts.set(pq.question_id, (correctCounts.get(pq.question_id) || 0) + 1)
    })

    const allPassed = await prisma.passed_questions.findMany({
      where: {
        question_id: {
          in: questionIds
        }
      },
      select: {
        question_id: true
      }
    })

    allPassed.forEach(pq => {
      totalCounts.set(pq.question_id, (totalCounts.get(pq.question_id) || 0) + 1)
    })

    // Формируем ответ
    const formattedQuestions = questions.map(question => {
      const correct = correctCounts.get(question.id) || 0
      const total = totalCounts.get(question.id) || 0
      const averageCorrect = total > 0 ? (correct / total) * 100 : 0

      return {
        id: question.id,
        question: question.question,
        type_question: question.type_question,
        type_from: question.type_from,
        language: question.language,
        created_at: question.created_at.toISOString(),
        hasComplaint: complaintQuestionIds.has(question.id),
        averageCorrect: Math.round(averageCorrect * 10) / 10,
        photo_url: question.photo_url || undefined,
        points: question.points,
        time_limit: question.time_limit,
        explanation_ai: question.explanation_ai || undefined
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedQuestions
    })
  } catch (error) {
    console.error('Error fetching teacher questions:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      question,
      type_question,
      type_from,
      language,
      source_id,
      points,
      time_limit,
      photo_url,
      explanation_ai,
      answer_variants,
      correct_variant_index
    } = body

    // Валидация
    if (!question || !type_question || !type_from || !language || !source_id) {
      return NextResponse.json(
        { success: false, error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    if (!answer_variants || answer_variants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Необходимо минимум 2 варианта ответа' },
        { status: 400 }
      )
    }

    if (correct_variant_index < 0 || correct_variant_index >= answer_variants.length) {
      return NextResponse.json(
        { success: false, error: 'Неверный индекс правильного варианта' },
        { status: 400 }
      )
    }

    // Проверка, что source_id совпадает с ID текущего пользователя
    if (source_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Неверный source_id' },
        { status: 403 }
      )
    }

    // Фильтруем пустые варианты ответов
    const validVariants = answer_variants.filter((v: any) => v.value && v.value.trim())

    if (validVariants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Необходимо минимум 2 заполненных варианта ответа' },
        { status: 400 }
      )
    }

    // Создаем вопрос и варианты ответов в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Сначала создаем вопрос (correct_variants_id будет обновлен после создания вариантов)
      const newQuestion = await tx.questions.create({
        data: {
          question: question.trim(),
          correct_variants_id: '', // Временно пустое, обновим после создания вариантов
          type_question,
          type_from,
          source_id,
          points: points || 1,
          language,
          time_limit: time_limit || 60,
          photo_url: photo_url || null,
          explanation_ai: explanation_ai || null
        }
      })

      // Создаем варианты ответов
      const createdVariants = await Promise.all(
        validVariants.map((variant: any) =>
          tx.answer_variants.create({
            data: {
              question_id: newQuestion.id,
              value: variant.value.trim()
            }
          })
        )
      )

      // Определяем правильный вариант ответа
      const correctVariant = createdVariants[correct_variant_index]
      
      if (!correctVariant) {
        throw new Error('Неверный индекс правильного варианта')
      }

      // Обновляем вопрос с ID правильного варианта
      const updatedQuestion = await tx.questions.update({
        where: { id: newQuestion.id },
        data: {
          correct_variants_id: correctVariant.id
        }
      })

      return {
        question: updatedQuestion,
        variants: createdVariants
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: result.question.id,
        question: result.question.question,
        type_question: result.question.type_question,
        type_from: result.question.type_from,
        language: result.question.language,
        created_at: result.question.created_at.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

