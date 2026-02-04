import type { Note, NoteMetadata } from '@cobrain/core'
import { eq, desc, and, like, inArray, sql } from 'drizzle-orm'

import { getDatabase, generateId, notes, type NoteSource } from '../client.js'

export interface CreateNoteInput {
  content: string
  rawContent?: string
  source?: NoteSource
  userId: string
}

export interface UpdateNoteInput {
  content?: string
  isPinned?: boolean
  isArchived?: boolean
}

export interface NotesQueryOptions {
  userId: string
  limit?: number
  offset?: number
  includeArchived?: boolean
  search?: string
}

/**
 * Convert database Note to Core Note type
 */
function toNote(dbNote: typeof notes.$inferSelect): Note {
  return {
    id: dbNote.id,
    content: dbNote.content,
    rawContent: dbNote.rawContent ?? undefined,
    entities: [],
    createdAt: dbNote.createdAt,
    updatedAt: dbNote.updatedAt,
    metadata: {
      source: dbNote.source as NoteMetadata['source'],
      isArchived: dbNote.isArchived,
      isPinned: dbNote.isPinned,
    },
  }
}

export const notesRepository = {
  async create(input: CreateNoteInput): Promise<Note> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(notes).values({
      id,
      content: input.content,
      rawContent: input.rawContent,
      source: input.source ?? 'text',
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    })

    const note = await db.select().from(notes).where(eq(notes.id, id)).get()
    return toNote(note!)
  },

  async findById(id: string): Promise<Note | null> {
    const db = getDatabase()
    const note = await db.select().from(notes).where(eq(notes.id, id)).get()
    return note ? toNote(note) : null
  },

  async findByUser(options: NotesQueryOptions): Promise<Note[]> {
    const db = getDatabase()
    const { userId, limit = 50, offset = 0, includeArchived = false, search } = options

    const conditions = [eq(notes.userId, userId)]

    if (!includeArchived) {
      conditions.push(eq(notes.isArchived, false))
    }

    if (search) {
      conditions.push(like(notes.content, `%${search}%`))
    }

    const result = await db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.isPinned), desc(notes.createdAt))
      .limit(limit)
      .offset(offset)

    return result.map(toNote)
  },

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    const db = getDatabase()
    const updates: Partial<typeof notes.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.content !== undefined) updates.content = input.content
    if (input.isPinned !== undefined) updates.isPinned = input.isPinned
    if (input.isArchived !== undefined) updates.isArchived = input.isArchived

    await db.update(notes).set(updates).where(eq(notes.id, id))

    const note = await db.select().from(notes).where(eq(notes.id, id)).get()
    return toNote(note!)
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(notes).where(eq(notes.id, id))
  },

  async search(userId: string, query: string, limit = 20): Promise<Note[]> {
    const db = getDatabase()

    const result = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isArchived, false),
          like(notes.content, `%${query}%`)
        )
      )
      .orderBy(desc(notes.createdAt))
      .limit(limit)

    return result.map(toNote)
  },

  async count(userId: string, includeArchived = false): Promise<number> {
    const db = getDatabase()

    const conditions = [eq(notes.userId, userId)]
    if (!includeArchived) {
      conditions.push(eq(notes.isArchived, false))
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(and(...conditions))
      .get()

    return result?.count ?? 0
  },

  async findByIds(ids: string[]): Promise<Note[]> {
    if (ids.length === 0) return []

    const db = getDatabase()
    const result = await db
      .select()
      .from(notes)
      .where(inArray(notes.id, ids))

    // Preserve order of input IDs
    const noteMap = new Map(result.map((n) => [n.id, n]))
    return ids
      .map((id) => noteMap.get(id))
      .filter((n): n is NonNullable<typeof n> => n !== undefined)
      .map(toNote)
  },
}
