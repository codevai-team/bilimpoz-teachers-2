import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/cookie-config'

// Публичные маршруты, которые не требуют аутентификации
const publicRoutes = ['/login', '/verify-telegram']

// Маршруты, которые требуют аутентификации
const protectedRoutes = ['/', '/questions', '/discussions', '/settings', '/students']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Получаем токен из cookies
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  
  // Проверяем, является ли маршрут защищенным
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Проверяем, является ли маршрут публичным
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Если пользователь пытается попасть на защищенный маршрут без токена
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Если пользователь с токеном пытается попасть на страницу входа
  if (isPublicRoute && token && pathname === '/login') {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }
  
  return NextResponse.next()
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

