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
import type { ExtractedEntity } from '@cobrain/ai'
import type { ExtractedReminder } from '@cobrain/ai'

const processSchema = z.object({
  noteId: z.string().min(1, 'noteId is required'),
  options: z
    .object({
      extractEntities: z.boolean().optional(),
      extractReminders: z.boolean().optional(),
      generateEmbedding: z.boolean().optional(),
    })
    .optional(),
})

const processAllSchema = z.object({
  action: z.literal('processAll'),
  limit: z.number().min(1).max(100).optional().default(50),
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

// Convert database note to core Note type
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

    // Handle processAll action
    if (body.action === 'processAll') {
      const result = processAllSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.errors[0].message },
          { status: 400 }
        )
      }

      return await handleProcessAll(session.user.id, result.data.limit)
    }

    // Handle single note processing
    const result = processSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { noteId, options } = result.data

    // Fetch the note
    const dbNote = await notesRepository.findById(noteId)
    if (!dbNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const note = toNote(dbNote as any)

    // Get provider
    const provider = await getProvider()

    // Create processor dependencies
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
          weight: 0.5, // Co-occurrence relation
        })
      },
    }

    // Process the note
    const processingResult = await processNote(note, session.user.id, deps, options)

    // Clean up provider
    if (provider) {
      await provider.dispose()
    }

    return NextResponse.json({
      success: true,
      noteId,
      entities: processingResult.entities.length,
      reminders: processingResult.reminders.length,
      hasEmbedding: !!processingResult.embedding,
      processingTime: processingResult.processingTime,
    })
  } catch (error) {
    console.error('Process note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleProcessAll(userId: string, limit: number) {
  const startTime = Date.now()

  // Get unprocessed notes (notes without embeddings)
  const dbNotes = await notesRepository.findByUser({
    userId,
    limit,
    includeArchived: false,
  })

  if (dbNotes.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: 'No notes to process',
    })
  }

  // Check which notes already have embeddings
  const noteIds = dbNotes.map((n) => n.id)
  const existingEmbeddings = await embeddingsRepository.findByNoteIds(noteIds)
  const processedIds = new Set(existingEmbeddings.map((e) => e.noteId))

  // Filter to only unprocessed notes
  const unprocessedNotes = dbNotes.filter((n) => !processedIds.has(n.id))

  if (unprocessedNotes.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: 'All notes already processed',
    })
  }

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
      await embeddingsRepository.store({ noteId, vector: embedding })
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

  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const dbNote of unprocessedNotes) {
    try {
      const note = toNote(dbNote as any)
      await processNote(note, userId, deps)
      processed++
    } catch (error) {
      failed++
      errors.push(`Note ${dbNote.id}: ${(error as Error).message}`)
    }
  }

  if (provider) {
    await provider.dispose()
  }

  return NextResponse.json({
    success: true,
    processed,
    failed,
    totalTime: Date.now() - startTime,
    errors: errors.slice(0, 5), // Return first 5 errors
  })
}
