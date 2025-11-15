import { NextRequest } from 'next/server'
import { authenticatedHandler } from '@/lib/auth'

export async function GET(request: NextRequest) {
  return authenticatedHandler(request, async (user) => {
    return Response.json(user)
  })
}




