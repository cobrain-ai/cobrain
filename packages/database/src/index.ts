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
