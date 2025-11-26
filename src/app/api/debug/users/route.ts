import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Fetching all users from database...')
    
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        login: true,
        role: true,
        status: true,
        telegram_id: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    console.log(`[DEBUG] Found ${users.length} users`)
    users.forEach(user => {
      console.log(`[DEBUG] User: ${user.login} (${user.name}) - Status: ${user.status}, Role: ${user.role}, Telegram: ${user.telegram_id || 'none'}`)
    })

    return NextResponse.json({
      success: true,
      users: users
    })
  } catch (error) {
    console.error('[DEBUG] Error fetching users:', error)
    return NextResponse.json(
      { error: 'Ошибка получения пользователей' },
      { status: 500 }
    )
  }
}


