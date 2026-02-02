import type { Entity, EntityType, LLMProvider } from '@cobrain/core'
import { generateId } from '@cobrain/core'

export interface ExtractionResult {
  entities: Entity[]
  reminders: ExtractedReminder[]
  commitments: ExtractedCommitment[]
}

export interface ExtractedReminder {
  message: string
  triggerAt: Date
  originalText: string
}

export interface ExtractedCommitment {
  description: string
  person?: string
  deadline?: Date
  originalText: string
}

const EXTRACTION_PROMPT = `You are an AI assistant that extracts structured information from text.
Analyze the following text and extract:
1. Named entities (people, places, organizations, dates, times, projects, tasks)
2. Time-based reminders (e.g., "remind me tomorrow at 2pm")
3. Commitments (e.g., "I promised to...")

Respond in JSON format:
{
  "entities": [
    { "type": "person|place|organization|event|date|time|task|project|concept", "name": "entity name" }
  ],
  "reminders": [
    { "message": "reminder text", "triggerAt": "ISO date string", "originalText": "source text" }
  ],
  "commitments": [
    { "description": "commitment description", "person": "person name or null", "deadline": "ISO date or null", "originalText": "source text" }
  ]
}

Text to analyze:`

export async function extractEntities(
  text: string,
  provider: LLMProvider
): Promise<ExtractionResult> {
  const result = await provider.complete([
    {
      role: 'system',
      content: EXTRACTION_PROMPT,
    },
    {
      role: 'user',
      content: text,
    },
  ])

  try {
    const parsed = JSON.parse(result.content)
    const now = new Date()

    return {
      entities: (parsed.entities ?? []).map(
        (e: { type: EntityType; name: string }) => ({
          id: generateId(),
          type: e.type,
          name: e.name,
          createdAt: now,
          updatedAt: now,
        })
      ),
      reminders: (parsed.reminders ?? []).map(
        (r: { message: string; triggerAt: string; originalText: string }) => ({
          message: r.message,
          triggerAt: new Date(r.triggerAt),
          originalText: r.originalText,
        })
      ),
      commitments: (parsed.commitments ?? []).map(
        (c: {
          description: string
          person?: string
          deadline?: string
          originalText: string
        }) => ({
          description: c.description,
          person: c.person,
          deadline: c.deadline ? new Date(c.deadline) : undefined,
          originalText: c.originalText,
        })
      ),
    }
  } catch {
    // If JSON parsing fails, return empty result
    return { entities: [], reminders: [], commitments: [] }
  }
}

export function parseNaturalDate(text: string, referenceDate = new Date()): Date | null {
  const lower = text.toLowerCase()

  // Today
  if (lower.includes('today')) {
    return referenceDate
  }

  // Tomorrow
  if (lower.includes('tomorrow')) {
    const date = new Date(referenceDate)
    date.setDate(date.getDate() + 1)
    return date
  }

  // Next week
  if (lower.includes('next week')) {
    const date = new Date(referenceDate)
    date.setDate(date.getDate() + 7)
    return date
  }

  // In X days/hours/minutes
  const inMatch = lower.match(/in (\d+) (day|hour|minute|week)s?/)
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10)
    const unit = inMatch[2]
    const date = new Date(referenceDate)

    switch (unit) {
      case 'minute':
        date.setMinutes(date.getMinutes() + amount)
        break
      case 'hour':
        date.setHours(date.getHours() + amount)
        break
      case 'day':
        date.setDate(date.getDate() + amount)
        break
      case 'week':
        date.setDate(date.getDate() + amount * 7)
        break
    }
    return date
  }

  // Time extraction (e.g., "at 2pm", "at 14:00")
  const timeMatch = lower.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (timeMatch) {
    const date = new Date(referenceDate)
    let hours = parseInt(timeMatch[1], 10)
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const meridiem = timeMatch[3]?.toLowerCase()

    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0

    date.setHours(hours, minutes, 0, 0)
    return date
  }

  return null
}
