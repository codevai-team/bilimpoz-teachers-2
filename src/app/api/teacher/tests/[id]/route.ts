import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * GET /api/teacher/tests/{id}
 * Получение теста по ID
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

    // Получение теста
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
    console.error('Ошибка получения теста:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/teacher/tests/{id}
 * Обновление теста
 */
export async function PUT(
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
    const body = await request.json()
    const { name, description } = body

    // Проверка существования теста
    const existingTest = await prisma.teacher_tests.findUnique({
      where: { id: testId }
    })

    if (!existingTest) {
      return NextResponse.json(
        { success: false, error: 'Тест не найден' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    if (existingTest.created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Валидация
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Не все обязательные поля заполнены' },
        { status: 400 }
      )
    }

    // Обновление теста
    const updatedTest = await prisma.teacher_tests.update({
      where: { id: testId },
      data: {
        name: name.trim(),
        description: description.trim()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTest.id,
        name: updatedTest.name,
        description: updatedTest.description,
        language: updatedTest.language,
        createdAt: updatedTest.created_at.toISOString(),
        updatedAt: updatedTest.updated_at.toISOString()
      }
    })
  } catch (error) {
    console.error('Ошибка обновления теста:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teacher/tests/{id}
 * Удаление теста
 */
export async function DELETE(
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
    const existingTest = await prisma.teacher_tests.findUnique({
      where: { id: testId }
    })

    if (!existingTest) {
      return NextResponse.json(
        { success: false, error: 'Тест не найден' },
        { status: 404 }
      )
    }

    // Проверка прав доступа
    if (existingTest.created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Удаление теста (каскадное удаление вопросов через БД)
    await prisma.teacher_tests.delete({
      where: { id: testId }
    })

    return NextResponse.json({
      success: true,
      message: 'Тест удален'
    })
  } catch (error) {
    console.error('Ошибка удаления теста:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

