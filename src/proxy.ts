import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/jwt-middleware'

// Публичные маршруты, которые не требуют аутентификации
const publicRoutes = ['/register', '/login', '/verify-telegram']

// Маршруты, которые требуют аутентификации
const protectedRoutes = ['/', '/settings', '/referrals', '/tests']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Получаем язык из cookie или используем 'ru' по умолчанию
  const lang = request.cookies.get('lang')?.value || 'ru'
  
  // Получаем токен из запроса (cookie или header)
  const token = getTokenFromRequest(request)
  
  // Проверяем валидность токена один раз (если он есть)
  let payload = null
  let isValidToken = false
  
  if (token) {
    payload = await verifyToken(token)
    // Токен валиден, если payload существует и роль = teacher
    isValidToken = payload !== null && payload.role === 'teacher'
  }
  
  // Проверяем, является ли маршрут защищенным
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Если пользователь пытается попасть на защищенный маршрут без валидного токена
  if (isProtectedRoute && !isValidToken) {
    // Всегда редирект на страницу входа для неавторизованных
    const authUrl = new URL('/login', request.url)
    return NextResponse.redirect(authUrl)
  }
  
  // Если авторизованный пользователь пытается попасть на страницы входа/регистрации
  if (isPublicRoute && isValidToken && (pathname === '/login' || pathname === '/register')) {
    // Редирект на главную страницу
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }
  
  // Создаем ответ и устанавливаем cookie языка
  const response = NextResponse.next()
  response.cookies.set('lang', lang, { path: '/', maxAge: 31536000 }) // 1 год
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}











