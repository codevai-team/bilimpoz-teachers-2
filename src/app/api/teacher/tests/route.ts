import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/teacher/tests?teacherId={id}
 * Получение списка тестов учителя
 */
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
    const teacherId = searchParams.get('teacherId') || user.id

    // Проверка, что запрашивающий пользователь имеет доступ к этим данным
    if (teacherId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получение тестов из БД
    const tests = await prisma.teacher_tests.findMany({
      where: {
        created_by: teacherId
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Подсчет вопросов и прохождений для каждого теста
    const testsWithStats = await Promise.all(
      tests.map(async (test) => {
        // Подсчет вопросов в тесте
        const questionsCount = await prisma.questions.count({
          where: {
            source_id: test.id,
            type_from: 'from_teacher'
          }
        })

        // Подсчет прохождений теста
        // Находим все прохождения материалов, связанных с этим тестом
        const completionsCount = await prisma.passed_materials.count({
          where: {
            material_id: test.id,
            material_type: 'teacher_test'
          }
        })

        return {
          id: test.id,
          name: test.name,
          description: test.description,
          questionsCount,
          completionsCount,
          createdAt: test.created_at.toISOString(),
          updatedAt: test.updated_at.toISOString(),
          language: test.language
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: testsWithStats
    })
  } catch (error) {
    console.error('Ошибка получения тестов:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teacher/tests
 * Создание нового теста
 */
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
    const { name, description, teacherId, language } = body

    // Валидация
    if (!name || !description || !teacherId || !language) {
      return NextResponse.json(
        { success: false, error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Проверка, что teacherId совпадает с ID текущего пользователя
    if (teacherId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Неверный teacherId' },
        { status: 403 }
      )
    }

    // Проверка языка
    if (!['ru', 'kg'].includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный язык' },
        { status: 400 }
      )
    }

    // Создание теста
    const test = await prisma.teacher_tests.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        created_by: teacherId,
        language: language as 'ru' | 'kg'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: test.id,
        name: test.name,
        description: test.description,
        language: test.language,
        createdAt: test.created_at.toISOString(),
        updatedAt: test.updated_at.toISOString()
      }
    })
  } catch (error) {
    console.error('Ошибка создания теста:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

