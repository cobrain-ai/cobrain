import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as SQLite from 'expo-sqlite'

interface DatabaseContextValue {
  db: SQLite.SQLiteDatabase | null
  isReady: boolean
  error: Error | null
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
  error: null,
})

export function useDatabaseContext() {
  return useContext(DatabaseContext)
}

interface DatabaseProviderProps {
  children: ReactNode
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function initDatabase() {
      try {
        // Open database
        const database = await SQLite.openDatabaseAsync('cobrain.db')

        // Create tables if they don't exist
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            source TEXT DEFAULT 'text',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            value TEXT NOT NULL,
            normalized_value TEXT,
            note_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (note_id) REFERENCES notes(id)
          );

          CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
          CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
          CREATE INDEX IF NOT EXISTS idx_entities_note_id ON entities(note_id);
        `)

        setDb(database)
        setIsReady(true)
      } catch (e) {
        console.error('Failed to initialize database:', e)
        setError(e instanceof Error ? e : new Error('Unknown database error'))
      }
    }

    initDatabase()
  }, [])

  return (
    <DatabaseContext.Provider value={{ db, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  )
}
