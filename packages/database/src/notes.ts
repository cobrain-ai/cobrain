import type { Note } from '@cobrain/core'
import { generateId } from '@cobrain/core'

import type { NotesRepository } from './types.js'

export function createNotesRepository(db: unknown): NotesRepository {
  return {
    async create(data) {
      const now = new Date()
      const note: Note = {
        id: generateId(),
        content: data.content,
        rawContent: data.rawContent,
        entities: data.entities ?? [],
        embedding: data.embedding,
        metadata: data.metadata,
        createdAt: now,
        updatedAt: now,
      }

      // TODO: Implement SQLite insert
      // const stmt = db.prepare(`
      //   INSERT INTO notes (id, content, raw_content, entities, embedding, metadata, created_at, updated_at)
      //   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      // `)
      // stmt.run(note.id, note.content, note.rawContent, JSON.stringify(note.entities), ...)

      return note
    },

    async findById(id) {
      // TODO: Implement SQLite query
      // const stmt = db.prepare('SELECT * FROM notes WHERE id = ?')
      // const row = stmt.get(id)
      // return row ? mapRowToNote(row) : null
      return null
    },

    async findAll(options) {
      const limit = options?.limit ?? 100
      const offset = options?.offset ?? 0

      // TODO: Implement SQLite query
      // const stmt = db.prepare('SELECT * FROM notes ORDER BY created_at DESC LIMIT ? OFFSET ?')
      // const rows = stmt.all(limit, offset)
      // return rows.map(mapRowToNote)
      return []
    },

    async update(id, data) {
      const existing = await this.findById(id)
      if (!existing) {
        throw new Error(`Note not found: ${id}`)
      }

      const updated: Note = {
        ...existing,
        ...data,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      }

      // TODO: Implement SQLite update
      return updated
    },

    async delete(id) {
      // TODO: Implement SQLite delete
      // const stmt = db.prepare('DELETE FROM notes WHERE id = ?')
      // stmt.run(id)
    },

    async search(query, limit = 20) {
      // TODO: Implement full-text search
      // const stmt = db.prepare(`
      //   SELECT * FROM notes
      //   WHERE content LIKE ?
      //   ORDER BY created_at DESC
      //   LIMIT ?
      // `)
      // const rows = stmt.all(`%${query}%`, limit)
      // return rows.map(mapRowToNote)
      return []
    },
  }
}
