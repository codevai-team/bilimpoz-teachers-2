import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, USER_DATA_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/lib/cookie-config'

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Выход выполнен успешно'
  })

  // Удаление cookie с токеном с теми же параметрами безопасности
  // Это важно для правильного удаления cookie с secure и sameSite флагами
  // Используем maxAge: 0 для немедленного истечения
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...AUTH_COOKIE_CONFIG,
    maxAge: 0 // Немедленное истечение
  })
  
  // Удаляем данные пользователя из cookies
  response.cookies.set(USER_DATA_COOKIE_NAME, '', {
    ...AUTH_COOKIE_CONFIG,
    maxAge: 0 // Немедленное истечение
  })
  
  return response
}

