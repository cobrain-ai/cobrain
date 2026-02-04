import { cosineSimilarity } from '@cobrain/core'
import { eq, and, inArray, sql } from 'drizzle-orm'

import { getDatabase, generateId, embeddings, notes } from '../client.js'

export interface StoreEmbeddingInput {
  noteId: string
  vector: number[]
  model?: string
}

export interface SimilarResult {
  noteId: string
  score: number
}

/**
 * Serialize a Float32 array to Bytes for storage
 */
function serializeVector(vector: number[]): Buffer {
  const float32 = new Float32Array(vector)
  return Buffer.from(float32.buffer)
}

/**
 * Deserialize Bytes back to Float32 array
 */
function deserializeVector(bytes: Buffer | Uint8Array): number[] {
  const buffer = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
  const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)
  return Array.from(float32)
}

export const embeddingsRepository = {
  async store(input: StoreEmbeddingInput): Promise<void> {
    const db = getDatabase()
    const vector = serializeVector(input.vector)

    // Check if embedding exists
    const existing = await db
      .select()
      .from(embeddings)
      .where(eq(embeddings.noteId, input.noteId))
      .get()

    if (existing) {
      // Update existing
      await db
        .update(embeddings)
        .set({
          vector,
          model: input.model ?? 'nomic-embed-text',
          dimensions: input.vector.length,
          updatedAt: new Date(),
        })
        .where(eq(embeddings.noteId, input.noteId))
    } else {
      // Create new
      await db.insert(embeddings).values({
        id: generateId(),
        noteId: input.noteId,
        vector,
        model: input.model ?? 'nomic-embed-text',
        dimensions: input.vector.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  },

  async findByNote(noteId: string): Promise<number[] | null> {
    const db = getDatabase()
    const embedding = await db
      .select()
      .from(embeddings)
      .where(eq(embeddings.noteId, noteId))
      .get()

    if (!embedding) return null
    return deserializeVector(embedding.vector as Buffer)
  },

  async delete(noteId: string): Promise<void> {
    const db = getDatabase()
    await db.delete(embeddings).where(eq(embeddings.noteId, noteId))
  },

  /**
   * Find similar notes by vector similarity
   * Note: This is an in-memory implementation for MVP.
   * For production, use a proper vector database or SQLite vec extension.
   */
  async findSimilar(
    queryVector: number[],
    userId: string,
    options?: { limit?: number; threshold?: number }
  ): Promise<SimilarResult[]> {
    const db = getDatabase()
    const { limit = 10, threshold = 0.5 } = options ?? {}

    // Get user's non-archived notes
    const userNotes = await db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))

    if (userNotes.length === 0) return []

    const noteIds = userNotes.map((n) => n.id)

    // Get embeddings for user's notes
    const userEmbeddings = await db
      .select()
      .from(embeddings)
      .where(inArray(embeddings.noteId, noteIds))

    // Calculate similarities
    const results: SimilarResult[] = []

    for (const embedding of userEmbeddings) {
      const storedVector = deserializeVector(embedding.vector as Buffer)
      const score = cosineSimilarity(queryVector, storedVector)

      if (score >= threshold) {
        results.push({
          noteId: embedding.noteId,
          score,
        })
      }
    }

    // Sort by score and limit
    return results.sort((a, b) => b.score - a.score).slice(0, limit)
  },

  async count(): Promise<number> {
    const db = getDatabase()
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(embeddings)
      .get()

    return result?.count ?? 0
  },

  async findByNoteIds(
    noteIds: string[]
  ): Promise<Array<{ noteId: string; vector: Buffer }>> {
    if (noteIds.length === 0) return []

    const db = getDatabase()
    const result = await db
      .select({ noteId: embeddings.noteId, vector: embeddings.vector })
      .from(embeddings)
      .where(inArray(embeddings.noteId, noteIds))

    return result.map((r) => ({
      noteId: r.noteId,
      vector: r.vector as Buffer,
    }))
  },
}
