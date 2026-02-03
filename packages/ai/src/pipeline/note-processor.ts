import type { LLMProvider, Note } from '@cobrain/core'
import { extractEntities, extractReminders } from '../extraction/index.js'
import type { ExtractedEntity } from '../extraction/entity-extractor.js'
import type { ExtractedReminder } from '../extraction/reminder-extractor.js'

export interface ProcessingResult {
  noteId: string
  entities: ExtractedEntity[]
  reminders: ExtractedReminder[]
  embedding?: number[]
  processingTime: number
}

export interface ProcessingOptions {
  extractEntities?: boolean
  extractReminders?: boolean
  generateEmbedding?: boolean
}

export interface NoteProcessorDeps {
  provider?: LLMProvider
  getEmbedding?: (text: string) => Promise<number[]>
  saveEntity?: (entity: ExtractedEntity, noteId: string) => Promise<string>
  saveReminder?: (reminder: ExtractedReminder, noteId: string, userId: string) => Promise<void>
  saveEmbedding?: (noteId: string, embedding: number[]) => Promise<void>
  createRelation?: (fromId: string, toId: string, type: string) => Promise<void>
}

/**
 * Process a note to extract entities, reminders, and generate embeddings
 */
export async function processNote(
  note: Note,
  userId: string,
  deps: NoteProcessorDeps,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const startTime = Date.now()
  const {
    extractEntities: shouldExtractEntities = true,
    extractReminders: shouldExtractReminders = true,
    generateEmbedding: shouldGenerateEmbedding = true,
  } = options

  const result: ProcessingResult = {
    noteId: note.id,
    entities: [],
    reminders: [],
    processingTime: 0,
  }

  // Extract entities
  if (shouldExtractEntities) {
    result.entities = await extractEntities(note.content, deps.provider)

    // Save entities and link to note
    if (deps.saveEntity) {
      const entityIds: string[] = []
      for (const entity of result.entities) {
        const savedId = await deps.saveEntity(entity, note.id)
        entityIds.push(savedId)
      }

      // Create co-occurrence relations between entities in same note
      if (deps.createRelation && entityIds.length > 1) {
        for (let i = 0; i < entityIds.length; i++) {
          for (let j = i + 1; j < entityIds.length; j++) {
            await deps.createRelation(entityIds[i], entityIds[j], 'related_to')
          }
        }
      }
    }
  }

  // Extract reminders
  if (shouldExtractReminders) {
    result.reminders = await extractReminders(note.content, deps.provider)

    // Save reminders
    if (deps.saveReminder) {
      for (const reminder of result.reminders) {
        await deps.saveReminder(reminder, note.id, userId)
      }
    }
  }

  // Generate embedding
  if (shouldGenerateEmbedding && deps.getEmbedding) {
    try {
      result.embedding = await deps.getEmbedding(note.content)

      if (deps.saveEmbedding && result.embedding) {
        await deps.saveEmbedding(note.id, result.embedding)
      }
    } catch (error) {
      console.error('Embedding generation failed:', error)
    }
  }

  result.processingTime = Date.now() - startTime
  return result
}

/**
 * Process multiple notes in batch
 */
export async function processNotes(
  notes: Note[],
  userId: string,
  deps: NoteProcessorDeps,
  options: ProcessingOptions = {}
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = []

  for (const note of notes) {
    const result = await processNote(note, userId, deps, options)
    results.push(result)
  }

  return results
}

/**
 * Reprocess all notes for a user (for rebuilding graph)
 */
export async function reprocessAllNotes(
  notes: Note[],
  userId: string,
  deps: NoteProcessorDeps
): Promise<{ processed: number; failed: number; totalTime: number }> {
  const startTime = Date.now()
  let processed = 0
  let failed = 0

  for (const note of notes) {
    try {
      await processNote(note, userId, deps)
      processed++
    } catch (error) {
      console.error(`Failed to process note ${note.id}:`, error)
      failed++
    }
  }

  return {
    processed,
    failed,
    totalTime: Date.now() - startTime,
  }
}
