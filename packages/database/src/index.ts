// @cobrain/database - Database abstractions with Drizzle ORM

// Database client and connection
export {
  initDatabase,
  getDatabase,
  getSqlite,
  closeDatabase,
  generateId,
  schema,
} from './client.js'
export type { DrizzleDatabase, DatabaseConfig } from './client.js'

// Schema types
export type {
  NoteSource,
  ReminderStatus,
  ReminderType,
  User,
  NewUser,
  Note,
  NewNote,
  Entity,
  NewEntity,
  NoteEntity,
  NewNoteEntity,
  EntityRelation,
  NewEntityRelation,
  Embedding,
  NewEmbedding,
  Reminder,
  NewReminder,
  View,
  NewView,
  ViewSnapshot,
  NewViewSnapshot,
  PushSubscription,
  NewPushSubscription,
  Device,
  NewDevice,
} from './client.js'

// Repositories
export * from './repositories/index.js'

// Legacy types (for backward compatibility)
export * from './types.js'

// Placeholder for direct database access (used by push notification routes)
// TODO: Replace with proper repositories
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy({}, {
  get(_target, prop) {
    const notImplemented = () => {
      throw new Error(`prisma.${String(prop)} is not implemented. Use repositories instead.`)
    }
    return {
      findMany: notImplemented,
      findUnique: notImplemented,
      create: notImplemented,
      update: notImplemented,
      delete: notImplemented,
      deleteMany: notImplemented,
    }
  },
})
