import { prisma } from './prisma'
import { VerificationCodeType } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Временное хранилище в памяти (дублирование для надежности)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; userId: string; createdAt: Date }>()
const verificationCodesBackup = new Map<string, { code: string; expiresAt: Date; userId: string; createdAt: Date }>()

/**
 * Генерация 6-значного кода подтверждения
 */
export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  console.log('Generated verification code:', code)
  return code
}

/**
 * Хранение кода подтверждения
 */
export async function storeVerificationCode(userId: string, code: string, type: VerificationCodeType = 'login'): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 минут
  const createdAt = new Date()
  const codeData = { code, expiresAt, userId, createdAt }
  
  // Сохраняем в основное хранилище и резервную копию
  verificationCodes.set(userId, codeData)
  verificationCodesBackup.set(userId, { ...codeData })
  
  // Также сохраняем в базу данных для персистентности
  try {
    // Удаляем старые неиспользованные коды для этого пользователя и типа
    await prisma.verification_codes.deleteMany({
      where: {
        user_id: userId,
        type: type,
        used_at: null
      }
    })
    
    // Хешируем код перед сохранением в БД
    const hashCode = await bcrypt.hash(code, 10)
    
    // Сохраняем новый код
    await prisma.verification_codes.create({
      data: {
        user_id: userId,
        hash_code: hashCode,
        type: type,
        expires_at: expiresAt
      }
    })
  } catch (dbError) {
    console.error('Failed to save verification code to database:', dbError)
    // Продолжаем работу с памятью даже если БД недоступна
  }
  
  // Автоматическая очистка истекших кодов
  setTimeout(() => {
    verificationCodes.delete(userId)
    verificationCodesBackup.delete(userId)
  }, 5 * 60 * 1000)
}

/**
 * Проверка кода подтверждения
 */
export async function verifyCode(userId: string, inputCode: string, type: VerificationCodeType = 'login'): Promise<boolean> {
  // 1. Поиск в основном хранилище
  let stored = verificationCodes.get(userId)
  
  // 2. Если не найдено, проверяем резервную копию
  if (!stored) {
    stored = verificationCodesBackup.get(userId)
    if (stored) {
      // Восстанавливаем в основное хранилище
      verificationCodes.set(userId, stored)
    }
  }
  
  // 3. Если не найдено в памяти, проверяем базу данных
  if (!stored) {
    const dbCodes = await prisma.verification_codes.findMany({
      where: {
        user_id: userId,
        type: type,
        used_at: null
      },
      orderBy: { created_at: 'desc' },
      take: 1
    })
    
    if (dbCodes.length > 0) {
      const dbCode = dbCodes[0]
      
      // Проверяем срок действия
      if (dbCode.expires_at > new Date()) {
        // Проверяем код через bcrypt
        const isValid = await bcrypt.compare(inputCode, dbCode.hash_code)
        
        if (isValid) {
          stored = {
            code: inputCode, // Сохраняем для проверки в памяти
            expiresAt: dbCode.expires_at,
            userId: userId,
            createdAt: dbCode.created_at
          }
          // Восстанавливаем в память
          verificationCodes.set(userId, stored)
          verificationCodesBackup.set(userId, { ...stored })
        }
      } else {
        // Удаляем истекший код из БД
        await prisma.verification_codes.delete({ where: { id: dbCode.id } })
      }
    }
  }
  
  // 4. Проверка существования кода
  if (!stored) {
    return false
  }
  
  // 5. Проверка срока действия
  if (new Date() > stored.expiresAt) {
    // Удаляем истекший код
    verificationCodes.delete(userId)
    verificationCodesBackup.delete(userId)
    await prisma.verification_codes.deleteMany({
      where: { 
        user_id: userId,
        type: type,
        used_at: null
      }
    })
    return false
  }
  
  // 6. Проверка соответствия кода
  if (stored.code !== inputCode) {
    return false
  }
  
  // 7. Код верный, удаляем его из всех хранилищ и помечаем как использованный в БД
  verificationCodes.delete(userId)
  verificationCodesBackup.delete(userId)
  await prisma.verification_codes.updateMany({
    where: { 
      user_id: userId,
      type: type,
      used_at: null
    },
    data: {
      used_at: new Date()
    }
  })
  
  return true
}




