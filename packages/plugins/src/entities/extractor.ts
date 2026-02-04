// Entity Extraction Logic
// Moved from @cobrain/ai for plugin architecture

import type { Entity, EntityType, LLMProvider } from '@cobrain/core'
import { generateId } from '@cobrain/core'

export interface ExtractedEntity {
  id: string
  type: EntityType
  value: string
  normalizedValue: string
  confidence: number
  position?: { start: number; end: number }
}

export interface ExtractionOptions {
  extractPeople?: boolean
  extractPlaces?: boolean
  extractDates?: boolean
  extractUrls?: boolean
  extractProjects?: boolean
  extractTopics?: boolean
}

const ENTITY_EXTRACTION_PROMPT = `You are an entity extraction assistant. Extract entities from the given text and return them in JSON format.

For each entity found, identify:
- type: person, place, organization, date, time, project, task, topic, or concept
- value: the exact text as it appears
- normalizedValue: a normalized/canonical form (e.g., "John" -> "john", "next Tuesday" -> ISO date)
- confidence: 0.0-1.0 how confident you are

Return a JSON object with an "entities" array. Example:
{
  "entities": [
    { "type": "person", "value": "John Smith", "normalizedValue": "john smith", "confidence": 0.95 },
    { "type": "date", "value": "next Tuesday", "normalizedValue": "2026-02-10", "confidence": 0.9 },
    { "type": "project", "value": "Project Alpha", "normalizedValue": "project alpha", "confidence": 0.85 }
  ]
}

If no entities are found, return: { "entities": [] }

Text to analyze:`

/**
 * Extract URLs from text using regex
 */
export function extractUrls(text: string): ExtractedEntity[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
  const entities: ExtractedEntity[] = []
  let match

  while ((match = urlRegex.exec(text)) !== null) {
    entities.push({
      id: generateId(),
      type: 'custom',
      value: match[0],
      normalizedValue: match[0].toLowerCase(),
      confidence: 1.0,
      position: { start: match.index, end: match.index + match[0].length },
    })
  }

  return entities
}

/**
 * Extract dates using common patterns
 */
export function extractBasicDates(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = []
  const now = new Date()

  // Pattern: "tomorrow", "today", "yesterday"
  const relativeDays = [
    { pattern: /\btomorrow\b/gi, offset: 1 },
    { pattern: /\btoday\b/gi, offset: 0 },
    { pattern: /\byesterday\b/gi, offset: -1 },
  ]

  for (const { pattern, offset } of relativeDays) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const date = new Date(now)
      date.setDate(date.getDate() + offset)
      entities.push({
        id: generateId(),
        type: 'date',
        value: match[0],
        normalizedValue: date.toISOString().split('T')[0],
        confidence: 0.95,
        position: { start: match.index, end: match.index + match[0].length },
      })
    }
  }

  // Pattern: "next Monday", "this Friday", etc.
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayPattern = /\b(next|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi
  let dayMatch

  while ((dayMatch = dayPattern.exec(text)) !== null) {
    const modifier = dayMatch[1].toLowerCase()
    const dayName = dayMatch[2].toLowerCase()
    const targetDay = days.indexOf(dayName)
    const currentDay = now.getDay()

    let daysToAdd = targetDay - currentDay
    if (modifier === 'next' || daysToAdd <= 0) {
      daysToAdd += 7
    }

    const date = new Date(now)
    date.setDate(date.getDate() + daysToAdd)

    entities.push({
      id: generateId(),
      type: 'date',
      value: dayMatch[0],
      normalizedValue: date.toISOString().split('T')[0],
      confidence: 0.9,
      position: { start: dayMatch.index, end: dayMatch.index + dayMatch[0].length },
    })
  }

  // Pattern: "at 2pm", "at 14:00"
  const timePattern = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi
  let timeMatch

  while ((timeMatch = timePattern.exec(text)) !== null) {
    let hours = parseInt(timeMatch[1], 10)
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const meridiem = timeMatch[3]?.toLowerCase()

    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0

    entities.push({
      id: generateId(),
      type: 'time',
      value: timeMatch[0],
      normalizedValue: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      confidence: 0.9,
      position: { start: timeMatch.index, end: timeMatch.index + timeMatch[0].length },
    })
  }

  return entities
}

/**
 * Extract entities using LLM
 */
export async function extractEntitiesWithLLM(
  text: string,
  provider: LLMProvider
): Promise<ExtractedEntity[]> {
  try {
    const result = await provider.complete([
      { role: 'system', content: ENTITY_EXTRACTION_PROMPT },
      { role: 'user', content: text },
    ])

    const parsed = JSON.parse(result.content)
    const entities: ExtractedEntity[] = []

    for (const e of parsed.entities ?? []) {
      if (e.type && e.value) {
        entities.push({
          id: generateId(),
          type: e.type as EntityType,
          value: e.value,
          normalizedValue: e.normalizedValue ?? e.value.toLowerCase().trim(),
          confidence: e.confidence ?? 0.8,
        })
      }
    }

    return entities
  } catch (error) {
    console.error('LLM entity extraction failed:', error)
    return []
  }
}

/**
 * Main entity extraction function
 * Combines rule-based and LLM-based extraction
 */
export async function extractEntities(
  text: string,
  provider?: LLMProvider,
  options: ExtractionOptions = {}
): Promise<ExtractedEntity[]> {
  const { extractUrls: shouldExtractUrls = true, extractDates: shouldExtractDates = true } = options

  const entities: ExtractedEntity[] = []

  // Rule-based extraction (fast, high confidence)
  if (shouldExtractUrls) {
    entities.push(...extractUrls(text))
  }

  if (shouldExtractDates) {
    entities.push(...extractBasicDates(text))
  }

  // LLM-based extraction (slower, more comprehensive)
  if (provider) {
    const llmEntities = await extractEntitiesWithLLM(text, provider)

    // Merge LLM entities, avoiding duplicates
    for (const llmEntity of llmEntities) {
      const isDuplicate = entities.some(
        (e) => e.type === llmEntity.type && e.normalizedValue === llmEntity.normalizedValue
      )
      if (!isDuplicate) {
        entities.push(llmEntity)
      }
    }
  }

  return entities
}

/**
 * Convert extracted entities to core Entity type
 */
export function toEntities(extracted: ExtractedEntity[]): Entity[] {
  const now = new Date()
  return extracted.map((e) => ({
    id: e.id,
    type: e.type,
    name: e.value,
    metadata: {
      normalizedValue: e.normalizedValue,
      confidence: e.confidence,
      position: e.position,
    },
    createdAt: now,
    updatedAt: now,
  }))
}
