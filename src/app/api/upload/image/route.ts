import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileToS3, getS3Path, generateFileName } from '@/lib/s3'

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

    // Проверка роли (только учителя могут загружать изображения)
    if (user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем файл из FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не предоставлен' },
        { status: 400 }
      )
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }

    // Проверка размера файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Размер файла превышает 5MB' },
        { status: 400 }
      )
    }

    // Конвертируем File в Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Генерируем уникальное имя файла
    const fileName = generateFileName(file.name, 'question')
    
    // Получаем путь в S3 для изображений вопросов
    const s3Path = getS3Path('question-pictures')

    // Загружаем в S3
    const fileUrl = await uploadFileToS3(buffer, fileName, file.type, s3Path)

    return NextResponse.json({
      success: true,
      url: fileUrl
    })
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}