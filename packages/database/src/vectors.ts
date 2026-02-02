import { cosineSimilarity } from '@cobrain/core'

import type { VectorsRepository } from './types.js'

/**
 * In-memory vector store for MVP
 * TODO: Replace with SQLite vec extension or dedicated vector DB
 */
export function createVectorsRepository(): VectorsRepository {
  const vectors = new Map<string, number[]>()

  return {
    async store(id, embedding) {
      vectors.set(id, embedding)
    },

    async findSimilar(embedding, limit = 10, threshold = 0.7) {
      const results: Array<{ id: string; score: number }> = []

      for (const [id, stored] of vectors) {
        const score = cosineSimilarity(embedding, stored)
        if (score >= threshold) {
          results.push({ id, score })
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    },

    async delete(id) {
      vectors.delete(id)
    },
  }
}
