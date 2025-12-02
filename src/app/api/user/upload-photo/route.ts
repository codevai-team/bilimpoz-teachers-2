import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileToPublicS3, deleteFileFromPublicS3, isS3Url, generateFileName } from '@/lib/s3'

// Путь для хранения фото профилей преподавателей в S3
const TEACHER_PROFILE_PHOTOS_PATH = 'teacher_profile_photos'

export async function POST(request: NextRequest) {
  try {
    const user = await auth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      )
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 5MB' },
        { status: 400 }
      )
    }

    // Получаем текущее фото профиля для последующего удаления
    const currentUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { profile_photo_url: true }
    })

    const oldPhotoUrl = currentUser?.profile_photo_url

    // Генерируем уникальное имя файла
    const fileName = generateFileName(file.name, `teacher_${user.id}`)

    // Конвертируем файл в Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Загружаем файл в PUBLIC S3
    const fileUrl = await uploadFileToPublicS3(
      buffer,
      fileName,
      file.type,
      TEACHER_PROFILE_PHOTOS_PATH
    )

    // Обновляем URL фото в базе данных
    await prisma.users.update({
      where: { id: user.id },
      data: {
        profile_photo_url: fileUrl,
        updated_at: new Date()
      }
    })

    // Удаляем старое фото из S3 (если оно было в S3)
    if (oldPhotoUrl && isS3Url(oldPhotoUrl)) {
      try {
        await deleteFileFromPublicS3(oldPhotoUrl)
        console.log('✅ Старое фото профиля удалено из S3:', oldPhotoUrl)
      } catch (deleteError) {
        // Логируем ошибку, но не прерываем процесс
        console.warn('⚠️ Не удалось удалить старое фото из S3:', deleteError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Фото профиля успешно обновлено',
      photo_url: fileUrl
    })
  } catch (error) {
    console.error('Upload photo error:', error)
    
    // Возвращаем более информативную ошибку
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
