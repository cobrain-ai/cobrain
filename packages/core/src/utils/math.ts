/**
 * Calculate the cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means identical direction,
 * 0 means orthogonal, and -1 means opposite direction.
 *
 * @throws Error if vectors have different dimensions
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}
