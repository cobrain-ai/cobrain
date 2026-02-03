import { describe, it, expect } from 'vitest'
import { cosineSimilarity } from './math.js'

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const a = [1, 2, 3]
    const b = [1, 2, 3]
    expect(cosineSimilarity(a, b)).toBeCloseTo(1)
  })

  it('should return -1 for opposite vectors', () => {
    const a = [1, 2, 3]
    const b = [-1, -2, -3]
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1)
  })

  it('should return 0 for orthogonal vectors', () => {
    const a = [1, 0]
    const b = [0, 1]
    expect(cosineSimilarity(a, b)).toBeCloseTo(0)
  })

  it('should handle zero vectors', () => {
    const a = [0, 0, 0]
    const b = [1, 2, 3]
    expect(cosineSimilarity(a, b)).toBe(0)
  })

  it('should throw error for different dimensions', () => {
    const a = [1, 2, 3]
    const b = [1, 2]
    expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have same dimensions')
  })

  it('should handle normalized vectors', () => {
    const a = [1 / Math.sqrt(2), 1 / Math.sqrt(2)]
    const b = [1, 0]
    expect(cosineSimilarity(a, b)).toBeCloseTo(1 / Math.sqrt(2))
  })

  it('should handle high-dimensional vectors', () => {
    const dimensions = 1536 // Common embedding dimension
    const a = Array.from({ length: dimensions }, () => Math.random())
    const b = [...a] // Same vector
    expect(cosineSimilarity(a, b)).toBeCloseTo(1)
  })
})
