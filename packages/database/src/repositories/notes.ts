import type { Note, NoteMetadata } from '@cobrain/core'
import type { NoteSource } from '@prisma/client'

import { prisma } from '../client.js'

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
 * Convert Prisma Note to Core Note type
 */
function toNote(dbNote: {
  id: string
  content: string
  rawContent: string | null
  source: NoteSource
  isPinned: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}): Note {
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
    const note = await prisma.note.create({
      data: {
        content: input.content,
        rawContent: input.rawContent,
        source: input.source ?? 'text',
        userId: input.userId,
      },
    })
    return toNote(note)
  },

  async findById(id: string): Promise<Note | null> {
    const note = await prisma.note.findUnique({
      where: { id },
    })
    return note ? toNote(note) : null
  },

  async findByUser(options: NotesQueryOptions): Promise<Note[]> {
    const { userId, limit = 50, offset = 0, includeArchived = false, search } = options

    const notes = await prisma.note.findMany({
      where: {
        userId,
        isArchived: includeArchived ? undefined : false,
        ...(search && {
          content: {
            contains: search,
          },
        }),
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    })

    return notes.map(toNote)
  },

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(input.content !== undefined && { content: input.content }),
        ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
        ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
      },
    })
    return toNote(note)
  },

  async delete(id: string): Promise<void> {
    await prisma.note.delete({
      where: { id },
    })
  },

  async search(userId: string, query: string, limit = 20): Promise<Note[]> {
    const notes = await prisma.note.findMany({
      where: {
        userId,
        isArchived: false,
        content: {
          contains: query,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return notes.map(toNote)
  },

  async count(userId: string, includeArchived = false): Promise<number> {
    return prisma.note.count({
      where: {
        userId,
        isArchived: includeArchived ? undefined : false,
      },
    })
  },
}
