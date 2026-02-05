/**
 * CoBrain Database Schema
 * Using Drizzle ORM with SQLite and cr-sqlite for CRDT sync
 */

import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core'

// ============================================
// Enums (as string literals in SQLite)
// ============================================

export type NoteSource = 'text' | 'voice' | 'import'
export type ReminderStatus = 'pending' | 'triggered' | 'dismissed' | 'completed'
export type ReminderType = 'time' | 'commitment' | 'follow_up'

// ============================================
// User Management
// ============================================

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    settings: text('settings', { mode: 'json' }).default('{}').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)]
)

// ============================================
// Notes & Content
// ============================================

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey().notNull(),
    content: text('content').notNull(),
    rawContent: text('raw_content'),
    source: text('source').$type<NoteSource>().default('text').notNull(),
    isPinned: integer('is_pinned', { mode: 'boolean' }).default(false).notNull(),
    isArchived: integer('is_archived', { mode: 'boolean' }).default(false).notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index('notes_user_id_idx').on(table.userId),
    index('notes_created_at_idx').on(table.createdAt),
  ]
)

// ============================================
// Knowledge Graph - Entities
// ============================================

export const entities = sqliteTable(
  'entities',
  {
    id: text('id').primaryKey().notNull(),
    type: text('type').notNull(), // person, place, organization, date, time, project, task, topic, custom
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(), // lowercase, trimmed for matching
    metadata: text('metadata', { mode: 'json' }).default('{}').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('entities_type_normalized_name_idx').on(table.type, table.normalizedName),
    index('entities_type_idx').on(table.type),
    index('entities_normalized_name_idx').on(table.normalizedName),
  ]
)

export const noteEntities = sqliteTable(
  'note_entities',
  {
    id: text('id').primaryKey().notNull(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    entityId: text('entity_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    confidence: real('confidence').default(1.0).notNull(),
    startIndex: integer('start_index'),
    endIndex: integer('end_index'),
  },
  (table) => [
    uniqueIndex('note_entities_note_entity_idx').on(table.noteId, table.entityId),
    index('note_entities_note_id_idx').on(table.noteId),
    index('note_entities_entity_id_idx').on(table.entityId),
  ]
)

// ============================================
// Knowledge Graph - Relations
// ============================================

export const entityRelations = sqliteTable(
  'entity_relations',
  {
    id: text('id').primaryKey().notNull(),
    fromId: text('from_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    toId: text('to_id')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // mentions, related_to, part_of, depends_on, assigned_to, etc.
    weight: real('weight').default(1.0).notNull(),
    metadata: text('metadata', { mode: 'json' }).default('{}').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('entity_relations_from_to_type_idx').on(table.fromId, table.toId, table.type),
    index('entity_relations_from_id_idx').on(table.fromId),
    index('entity_relations_to_id_idx').on(table.toId),
    index('entity_relations_type_idx').on(table.type),
  ]
)

// ============================================
// Vector Embeddings
// ============================================

export const embeddings = sqliteTable(
  'embeddings',
  {
    id: text('id').primaryKey().notNull(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    vector: blob('vector').notNull(), // Serialized Float32Array
    model: text('model').default('nomic-embed-text').notNull(),
    dimensions: integer('dimensions').default(768).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('embeddings_note_id_idx').on(table.noteId),
  ]
)

// ============================================
// Reminders & Notifications
// ============================================

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey().notNull(),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    triggerAt: integer('trigger_at', { mode: 'timestamp' }).notNull(),
    recurring: text('recurring'), // cron pattern for recurring reminders
    status: text('status').$type<ReminderStatus>().default('pending').notNull(),
    extractedText: text('extracted_text'),
    type: text('type').$type<ReminderType>().default('time').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index('reminders_user_status_idx').on(table.userId, table.status),
    index('reminders_trigger_at_idx').on(table.triggerAt),
  ]
)

// ============================================
// Dynamic Views
// ============================================

export const views = sqliteTable(
  'views',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    type: text('type').default('custom').notNull(), // custom, projects, tasks, people, timeline, etc.
    query: text('query', { mode: 'json' }).notNull(), // Filter/query definition
    layout: text('layout').default('list').notNull(), // list, grid, timeline, kanban, graph
    settings: text('settings', { mode: 'json' }).default('{}').notNull(),
    isShared: integer('is_shared', { mode: 'boolean' }).default(false).notNull(),
    shareToken: text('share_token'),
    sharePassword: text('share_password'), // Hashed password for protected shares
    shareExpiresAt: integer('share_expires_at', { mode: 'timestamp' }), // Expiration date
    isPinned: integer('is_pinned', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    index('views_user_id_idx').on(table.userId),
    uniqueIndex('views_share_token_idx').on(table.shareToken),
  ]
)

// Share Access Analytics
export const shareAccessLogs = sqliteTable(
  'share_access_logs',
  {
    id: text('id').primaryKey().notNull(),
    viewId: text('view_id')
      .notNull()
      .references(() => views.id, { onDelete: 'cascade' }),
    accessedAt: integer('accessed_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    country: text('country'),
  },
  (table) => [
    index('share_access_logs_view_id_idx').on(table.viewId),
    index('share_access_logs_accessed_at_idx').on(table.accessedAt),
  ]
)

export const viewSnapshots = sqliteTable(
  'view_snapshots',
  {
    id: text('id').primaryKey().notNull(),
    viewId: text('view_id')
      .notNull()
      .references(() => views.id, { onDelete: 'cascade' }),
    name: text('name'),
    data: text('data', { mode: 'json' }).notNull(), // Frozen view data at this point
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index('view_snapshots_view_id_idx').on(table.viewId)]
)

// ============================================
// Push Notifications
// ============================================

export const pushSubscriptions = sqliteTable(
  'push_subscriptions',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id').notNull(),
    endpoint: text('endpoint').notNull(),
    keys: text('keys', { mode: 'json' }).notNull(), // { p256dh, auth }
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('push_subscriptions_endpoint_idx').on(table.endpoint),
    index('push_subscriptions_user_id_idx').on(table.userId),
  ]
)

// ============================================
// Sync & Devices
// ============================================

export const devices = sqliteTable(
  'devices',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    platform: text('platform').notNull(), // web, ios, android, desktop
    lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [index('devices_user_id_idx').on(table.userId)]
)

// ============================================
// Type exports for repositories
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Entity = typeof entities.$inferSelect
export type NewEntity = typeof entities.$inferInsert
export type NoteEntity = typeof noteEntities.$inferSelect
export type NewNoteEntity = typeof noteEntities.$inferInsert
export type EntityRelation = typeof entityRelations.$inferSelect
export type NewEntityRelation = typeof entityRelations.$inferInsert
export type Embedding = typeof embeddings.$inferSelect
export type NewEmbedding = typeof embeddings.$inferInsert
export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert
export type View = typeof views.$inferSelect
export type NewView = typeof views.$inferInsert
export type ViewSnapshot = typeof viewSnapshots.$inferSelect
export type NewViewSnapshot = typeof viewSnapshots.$inferInsert
export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert
export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert
export type ShareAccessLog = typeof shareAccessLogs.$inferSelect
export type NewShareAccessLog = typeof shareAccessLogs.$inferInsert
