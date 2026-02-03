import { cosineSimilarity } from '@cobrain/core'

import { prisma } from '../client.js'

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
function deserializeVector(bytes: Buffer): number[] {
  const float32 = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4)
  return Array.from(float32)
}

export const embeddingsRepository = {
  async store(input: StoreEmbeddingInput): Promise<void> {
    const vector = serializeVector(input.vector)

    await prisma.embedding.upsert({
      where: { noteId: input.noteId },
      update: {
        vector,
        model: input.model ?? 'nomic-embed-text',
        dimensions: input.vector.length,
      },
      create: {
        noteId: input.noteId,
        vector,
        model: input.model ?? 'nomic-embed-text',
        dimensions: input.vector.length,
      },
    })
  },

  async findByNote(noteId: string): Promise<number[] | null> {
    const embedding = await prisma.embedding.findUnique({
      where: { noteId },
    })

    if (!embedding) return null
    return deserializeVector(embedding.vector)
  },

  async delete(noteId: string): Promise<void> {
    await prisma.embedding.delete({
      where: { noteId },
    })
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
    const { limit = 10, threshold = 0.5 } = options ?? {}

    // Get all embeddings for user's notes
    const embeddings = await prisma.embedding.findMany({
      where: {
        note: {
          userId,
          isArchived: false,
        },
      },
      select: {
        noteId: true,
        vector: true,
      },
    })

    // Calculate similarities
    const results: SimilarResult[] = []

    for (const embedding of embeddings) {
      const storedVector = deserializeVector(embedding.vector)
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
    return prisma.embedding.count()
  },

  async findByNoteIds(
    noteIds: string[]
  ): Promise<Array<{ noteId: string; vector: Buffer }>> {
    if (noteIds.length === 0) return []

    const embeddings = await prisma.embedding.findMany({
      where: {
        noteId: { in: noteIds },
      },
      select: {
        noteId: true,
        vector: true,
      },
    })

    return embeddings
  },
}
