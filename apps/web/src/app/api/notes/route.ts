import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  notesRepository,
  entitiesRepository,
  remindersRepository,
  embeddingsRepository,
} from '@cobrain/database'
import { processNote, type NoteProcessorDeps } from '@cobrain/ai'
import { ProviderFactory, type LLMProvider, type Note } from '@cobrain/core'
import type { ExtractedEntity, ExtractedReminder } from '@cobrain/ai'

const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  source: z.enum(['text', 'voice', 'import']).optional().default('text'),
  skipProcessing: z.boolean().optional().default(false),
})

// Get LLM provider
async function getProvider(): Promise<LLMProvider | null> {
  try {
    const provider = ProviderFactory.ollama({ model: 'llama3:8b' })
    await provider.initialize()
    if (await provider.isAvailable()) {
      return provider
    }
  } catch {
    // Provider not available
  }
  return null
}

// Get embedding using Ollama
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding error: ${response.status}`)
  }

  const data = await response.json()
  return data.embedding as number[]
}

// Convert to core Note type
function toNote(dbNote: {
  id: string
  content: string
  rawContent: string | null
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  isArchived: boolean
  source: string
}): Note {
  return {
    id: dbNote.id,
    content: dbNote.content,
    rawContent: dbNote.rawContent ?? undefined,
    entities: [],
    createdAt: dbNote.createdAt,
    updatedAt: dbNote.updatedAt,
    metadata: {
      source: dbNote.source as 'text' | 'voice' | 'import',
      isPinned: dbNote.isPinned,
      isArchived: dbNote.isArchived,
    },
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createNoteSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, source, skipProcessing } = result.data

    // Save to database
    const dbNote = await notesRepository.create({
      content,
      source,
      userId: session.user.id,
    })

    const note = toNote(dbNote as any)

    // Process note in background (non-blocking)
    if (!skipProcessing) {
      processNoteInBackground(note, session.user.id).catch((err) =>
        console.error('Background processing failed:', err)
      )
    }

    return NextResponse.json({ note: dbNote }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processNoteInBackground(note: Note, userId: string) {
  const provider = await getProvider()

  const deps: NoteProcessorDeps = {
    provider: provider ?? undefined,
    getEmbedding,
    saveEntity: async (entity: ExtractedEntity, noteId: string) => {
      const saved = await entitiesRepository.create({
        type: entity.type,
        name: entity.value,
        metadata: {
          normalizedValue: entity.normalizedValue,
          confidence: entity.confidence,
        },
      })
      await entitiesRepository.linkToNote({
        noteId,
        entityId: saved.id,
        confidence: entity.confidence,
        startIndex: entity.position?.start,
        endIndex: entity.position?.end,
      })
      return saved.id
    },
    saveReminder: async (
      reminder: ExtractedReminder,
      noteId: string,
      passedUserId: string
    ) => {
      if (reminder.triggerAt) {
        await remindersRepository.create({
          noteId,
          userId: passedUserId,
          message: reminder.message,
          triggerAt: reminder.triggerAt,
          type: reminder.type,
          recurring: reminder.recurringPattern,
          extractedText: reminder.sourceText,
        })
      }
    },
    saveEmbedding: async (noteId: string, embedding: number[]) => {
      await embeddingsRepository.store({
        noteId,
        vector: embedding,
      })
    },
    createRelation: async (fromId: string, toId: string, type: string) => {
      await entitiesRepository.createRelation({
        fromId,
        toId,
        type: type as any,
        weight: 0.5,
      })
    },
  }

  try {
    await processNote(note, userId, deps)
  } finally {
    if (provider) {
      await provider.dispose()
    }
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const search = searchParams.get('search') ?? undefined

    // Fetch from database
    const notes = await notesRepository.findByUser({
      userId: session.user.id,
      limit,
      offset,
      search,
    })

    const total = await notesRepository.count(session.user.id)

    return NextResponse.json({ notes, total, limit, offset })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
