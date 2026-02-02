import { PrismaClient } from '@prisma/client'

// Prevent multiple instances during hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export type { PrismaClient }

/**
 * Initialize the database connection
 */
export async function initDatabase(): Promise<void> {
  await prisma.$connect()
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect()
}
