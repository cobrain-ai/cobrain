// @cobrain/database - Database abstractions

// Prisma client and connection
export { prisma, initDatabase, closeDatabase } from './client.js'
export type { PrismaClient } from './client.js'

// Prisma enums
export { NoteSource, ReminderStatus, ReminderType } from '@prisma/client'

// Repositories
export * from './repositories/index.js'

// Legacy types (for backward compatibility - prefer repository types)
export * from './types.js'
