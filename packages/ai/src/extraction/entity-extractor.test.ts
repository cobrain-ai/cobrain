import { describe, it, expect } from 'vitest'
import {
  extractUrls,
  extractBasicDates,
  extractEntities,
} from './entity-extractor.js'

describe('Entity Extractor', () => {
  describe('extractUrls', () => {
    it('should extract HTTP URLs', () => {
      const text = 'Check out http://example.com for more info'
      const entities = extractUrls(text)

      expect(entities).toHaveLength(1)
      expect(entities[0].type).toBe('custom')
      expect(entities[0].value).toBe('http://example.com')
      expect(entities[0].confidence).toBe(1.0)
    })

    it('should extract HTTPS URLs', () => {
      const text = 'Visit https://github.com/cobrain-ai/cobrain'
      const entities = extractUrls(text)

      expect(entities).toHaveLength(1)
      expect(entities[0].value).toBe('https://github.com/cobrain-ai/cobrain')
    })

    it('should extract multiple URLs', () => {
      const text = 'Links: https://first.com and https://second.com'
      const entities = extractUrls(text)

      expect(entities).toHaveLength(2)
    })

    it('should include position information', () => {
      const text = 'Visit https://example.com now'
      const entities = extractUrls(text)

      expect(entities[0].position).toBeDefined()
      expect(entities[0].position?.start).toBe(6)
      expect(entities[0].position?.end).toBe(25)
    })

    it('should return empty array when no URLs', () => {
      const text = 'This text has no URLs'
      const entities = extractUrls(text)

      expect(entities).toHaveLength(0)
    })
  })

  describe('extractBasicDates', () => {
    it('should extract "tomorrow"', () => {
      const text = 'Meeting tomorrow at noon'
      const entities = extractBasicDates(text)

      const dateEntity = entities.find((e) => e.value.toLowerCase() === 'tomorrow')
      expect(dateEntity).toBeDefined()
      expect(dateEntity?.type).toBe('date')
      expect(dateEntity?.confidence).toBeGreaterThan(0.9)
    })

    it('should extract "today"', () => {
      const text = 'Need to finish this today'
      const entities = extractBasicDates(text)

      const dateEntity = entities.find((e) => e.value.toLowerCase() === 'today')
      expect(dateEntity).toBeDefined()
      expect(dateEntity?.type).toBe('date')
    })

    it('should extract "next Monday"', () => {
      const text = 'Deadline is next Monday'
      const entities = extractBasicDates(text)

      expect(entities.some((e) => e.value.toLowerCase().includes('monday'))).toBe(
        true
      )
    })

    it('should extract time like "at 2pm"', () => {
      const text = 'Meeting at 2pm'
      const entities = extractBasicDates(text)

      const timeEntity = entities.find((e) => e.type === 'time')
      expect(timeEntity).toBeDefined()
      expect(timeEntity?.normalizedValue).toBe('14:00')
    })

    it('should extract time like "at 9:30am"', () => {
      const text = 'Call at 9:30am'
      const entities = extractBasicDates(text)

      const timeEntity = entities.find((e) => e.type === 'time')
      expect(timeEntity).toBeDefined()
      expect(timeEntity?.normalizedValue).toBe('09:30')
    })

    it('should handle multiple dates in one text', () => {
      const text = 'Start tomorrow and finish by next Friday'
      const entities = extractBasicDates(text)

      expect(entities.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('extractEntities (without LLM)', () => {
    it('should combine URL and date extraction', async () => {
      const text =
        'Visit https://example.com tomorrow to see the demo'
      const entities = await extractEntities(text)

      expect(entities.length).toBeGreaterThanOrEqual(2)
      expect(entities.some((e) => e.value.includes('example.com'))).toBe(true)
      expect(
        entities.some((e) => e.value.toLowerCase() === 'tomorrow')
      ).toBe(true)
    })

    it('should respect extraction options', async () => {
      const text = 'Check https://example.com tomorrow'

      const withUrls = await extractEntities(text, undefined, {
        extractUrls: true,
        extractDates: false,
      })
      expect(withUrls.some((e) => e.value.includes('example.com'))).toBe(true)
      expect(
        withUrls.some((e) => e.value.toLowerCase() === 'tomorrow')
      ).toBe(false)

      const withDates = await extractEntities(text, undefined, {
        extractUrls: false,
        extractDates: true,
      })
      expect(withDates.some((e) => e.value.includes('example.com'))).toBe(false)
      expect(
        withDates.some((e) => e.value.toLowerCase() === 'tomorrow')
      ).toBe(true)
    })

    it('should not duplicate entities', async () => {
      const text = 'Tomorrow tomorrow tomorrow'
      const entities = await extractEntities(text)

      // Each "tomorrow" should be extracted separately (different positions)
      const tomorrows = entities.filter(
        (e) => e.value.toLowerCase() === 'tomorrow'
      )
      expect(tomorrows.length).toBe(3)

      // But they should all have different positions
      const positions = new Set(tomorrows.map((e) => e.position?.start))
      expect(positions.size).toBe(3)
    })
  })
})
