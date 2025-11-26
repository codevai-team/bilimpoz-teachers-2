import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()

    console.log(`[DEBUG] Testing password for login: ${login}`)

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    // Найти пользователя
    const user = await prisma.users.findUnique({
      where: { login: login },
      select: {
        id: true,
        name: true,
        login: true,
        hash_password: true,
        role: true,
        status: true
      }
    })

    if (!user) {
      console.log(`[DEBUG] User not found: ${login}`)
      return NextResponse.json({
        found: false,
        message: 'Пользователь не найден'
      })
    }

    console.log(`[DEBUG] User found: ${user.login}`)
    console.log(`[DEBUG] Stored hash length: ${user.hash_password?.length || 0}`)
    console.log(`[DEBUG] Hash starts with: ${user.hash_password?.substring(0, 10)}...`)

    // Тестируем пароль разными способами
    const results = {
      found: true,
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
        role: user.role,
        status: user.status
      },
      passwordTests: {
        usingVerifyPassword: false,
        usingBcryptDirectly: false,
        usingPlainComparison: false
      }
    }

    // Тест 1: Используя нашу функцию verifyPassword
    try {
      results.passwordTests.usingVerifyPassword = await verifyPassword(password, user.hash_password)
      console.log(`[DEBUG] verifyPassword result: ${results.passwordTests.usingVerifyPassword}`)
    } catch (error) {
      console.log(`[DEBUG] verifyPassword error:`, error)
    }

    // Тест 2: Используя bcrypt напрямую
    try {
      results.passwordTests.usingBcryptDirectly = await bcrypt.compare(password, user.hash_password)
      console.log(`[DEBUG] bcrypt.compare result: ${results.passwordTests.usingBcryptDirectly}`)
    } catch (error) {
      console.log(`[DEBUG] bcrypt.compare error:`, error)
    }

    // Тест 3: Прямое сравнение (если пароль не хеширован)
    results.passwordTests.usingPlainComparison = password === user.hash_password
    console.log(`[DEBUG] plain comparison result: ${results.passwordTests.usingPlainComparison}`)

    return NextResponse.json(results)
  } catch (error) {
    console.error('[DEBUG] Error testing password:', error)
    return NextResponse.json(
      { error: 'Ошибка тестирования пароля' },
      { status: 500 }
    )
  }
}


