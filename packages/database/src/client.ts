/**
 * CoBrain Database Client
 * Using Drizzle ORM with better-sqlite3 and cr-sqlite for CRDT sync
 */

import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema/index.js'

// Tables that support CRDT sync
const SYNC_TABLES = [
  'users',
  'notes',
  'entities',
  'note_entities',
  'entity_relations',
  'reminders',
  'views',
  'view_snapshots',
  'devices',
]

// Global database instance for hot reload
const globalForDb = globalThis as unknown as {
  db: BetterSQLite3Database<typeof schema> | undefined
  sqlite: Database.Database | undefined
}

export type DrizzleDatabase = BetterSQLite3Database<typeof schema>

export interface DatabaseConfig {
  dbPath?: string
  enableCrdt?: boolean
  verbose?: boolean
}

/**
 * Initialize the database with Drizzle and optionally cr-sqlite
 */
export function initDatabase(config: DatabaseConfig = {}): {
  db: DrizzleDatabase
  sqlite: Database.Database
} {
  const { dbPath = 'cobrain.db', enableCrdt = false, verbose = false } = config

  // Return existing connection if available
  if (globalForDb.db && globalForDb.sqlite) {
    return { db: globalForDb.db, sqlite: globalForDb.sqlite }
  }

  // Create SQLite connection
  const sqlite = new Database(dbPath, {
    verbose: verbose ? console.log : undefined,
  })

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL')

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON')

  // Load cr-sqlite extension if enabled
  if (enableCrdt) {
    try {
      // cr-sqlite extension path varies by platform
      // This will be set up during installation
      const extensionPath = process.env.CRSQLITE_PATH
      if (extensionPath) {
        sqlite.loadExtension(extensionPath)
        console.log('[database] cr-sqlite extension loaded')

        // Enable CRDT on sync tables
        for (const table of SYNC_TABLES) {
          try {
            sqlite.exec(`SELECT crsql_as_crr('${table}')`)
          } catch {
            // Table might not exist yet, that's okay
          }
        }
        console.log('[database] CRDT enabled on sync tables')
      } else {
        console.warn('[database] CRSQLITE_PATH not set, skipping cr-sqlite')
      }
    } catch (error) {
      console.warn('[database] Failed to load cr-sqlite extension:', error)
    }
  }

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema })

  // Store globally for hot reload
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db
    globalForDb.sqlite = sqlite
  }

  return { db, sqlite }
}

/**
 * Get the database instance (initializes if not already done)
 */
export function getDatabase(): DrizzleDatabase {
  const { db } = initDatabase()
  return db
}

/**
 * Get the raw SQLite connection
 */
export function getSqlite(): Database.Database {
  const { sqlite } = initDatabase()
  return sqlite
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (globalForDb.sqlite) {
    globalForDb.sqlite.close()
    globalForDb.sqlite = undefined
    globalForDb.db = undefined
  }
}

/**
 * Generate a UUID (compatible with existing Prisma UUIDs)
 */
export function generateId(): string {
  return crypto.randomUUID()
}

// Re-export schema types
export * from './schema/index.js'

// Export the schema for use in repositories
export { schema }
