import { describe, it, expect } from 'vitest'
import { generateId } from './id.js'

describe('generateId', () => {
  it('should generate a valid UUID format', () => {
    const id = generateId()
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(1000)
  })

  it('should return a string of 36 characters', () => {
    const id = generateId()
    expect(id.length).toBe(36)
  })
})
