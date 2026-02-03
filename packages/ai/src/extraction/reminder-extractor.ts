import type { LLMProvider } from '@cobrain/core'
import { generateId } from '@cobrain/core'

export interface ExtractedReminder {
  id: string
  message: string
  triggerAt: Date | null
  type: 'time' | 'commitment' | 'follow_up'
  confidence: number
  sourceText: string
  isRecurring: boolean
  recurringPattern?: string
}

const REMINDER_EXTRACTION_PROMPT = `You are a reminder extraction assistant. Extract reminders and commitments from the given text.

For each reminder found, identify:
- type: "time" (specific time reminder), "commitment" (promise made), or "follow_up" (action to take)
- message: a clear description of what to be reminded about
- datetime: the date/time if mentioned (ISO 8601 format, or relative like "tomorrow", "next week")
- sourceText: the exact text that triggered this extraction
- isRecurring: whether this is a recurring reminder
- confidence: 0.0-1.0 how confident you are

Return a JSON object with a "reminders" array. Example:
{
  "reminders": [
    {
      "type": "time",
      "message": "Call John",
      "datetime": "2026-02-04T14:00:00",
      "sourceText": "call John tomorrow at 2pm",
      "isRecurring": false,
      "confidence": 0.95
    },
    {
      "type": "commitment",
      "message": "Send document to Sarah",
      "datetime": "2026-02-07",
      "sourceText": "I'll send the document by Friday",
      "isRecurring": false,
      "confidence": 0.9
    }
  ]
}

If no reminders found, return: { "reminders": [] }

Today's date is: ${new Date().toISOString().split('T')[0]}

Text to analyze:`

/**
 * Extract basic time-based reminders using regex patterns
 */
export function extractBasicReminders(text: string): ExtractedReminder[] {
  const reminders: ExtractedReminder[] = []
  const now = new Date()

  // Pattern: "remind me to X at Y" or "reminder: X"
  const remindPattern = /remind(?:er)?(?:\s+me)?\s+(?:to\s+)?(.+?)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?(?:\s+(?:on\s+)?(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday))?/gi

  let match
  while ((match = remindPattern.exec(text)) !== null) {
    const message = match[1]?.trim()
    if (!message) continue

    let triggerAt: Date | null = null

    // Parse time if provided
    if (match[2]) {
      let hours = parseInt(match[2], 10)
      const minutes = match[3] ? parseInt(match[3], 10) : 0
      const meridiem = match[4]?.toLowerCase()

      if (meridiem === 'pm' && hours < 12) hours += 12
      if (meridiem === 'am' && hours === 12) hours = 0

      triggerAt = new Date(now)
      triggerAt.setHours(hours, minutes, 0, 0)

      // If time has passed today, set for tomorrow
      if (triggerAt < now) {
        triggerAt.setDate(triggerAt.getDate() + 1)
      }
    }

    // Parse day if provided
    if (match[5]) {
      const dayWord = match[5].toLowerCase()
      if (dayWord === 'tomorrow') {
        if (!triggerAt) triggerAt = new Date(now)
        triggerAt.setDate(now.getDate() + 1)
      } else if (dayWord === 'today') {
        if (!triggerAt) triggerAt = new Date(now)
      } else {
        // Day of week
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const targetDay = days.indexOf(dayWord)
        if (targetDay !== -1) {
          if (!triggerAt) triggerAt = new Date(now)
          const currentDay = now.getDay()
          let daysToAdd = targetDay - currentDay
          if (daysToAdd <= 0) daysToAdd += 7
          triggerAt.setDate(now.getDate() + daysToAdd)
        }
      }
    }

    reminders.push({
      id: generateId(),
      message,
      triggerAt,
      type: 'time',
      confidence: 0.85,
      sourceText: match[0],
      isRecurring: false,
    })
  }

  // Pattern: "I'll X by Y" or "I will X by Y" (commitments)
  const commitmentPattern = /i(?:'ll| will)\s+(.+?)\s+by\s+(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|end of (?:the )?week)/gi

  while ((match = commitmentPattern.exec(text)) !== null) {
    const message = match[1]?.trim()
    if (!message) continue

    let triggerAt: Date | null = new Date(now)
    const timeWord = match[2].toLowerCase()

    if (timeWord === 'tomorrow') {
      triggerAt.setDate(now.getDate() + 1)
    } else if (timeWord === 'next week') {
      triggerAt.setDate(now.getDate() + 7)
    } else if (timeWord.includes('end of') && timeWord.includes('week')) {
      // Set to Friday
      const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7
      triggerAt.setDate(now.getDate() + daysUntilFriday)
    } else {
      // Day of week
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(timeWord)
      if (targetDay !== -1) {
        const currentDay = now.getDay()
        let daysToAdd = targetDay - currentDay
        if (daysToAdd <= 0) daysToAdd += 7
        triggerAt.setDate(now.getDate() + daysToAdd)
      }
    }

    reminders.push({
      id: generateId(),
      message,
      triggerAt,
      type: 'commitment',
      confidence: 0.8,
      sourceText: match[0],
      isRecurring: false,
    })
  }

  // Pattern: "every X" (recurring)
  const recurringPattern = /every\s+(day|morning|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)\s*(?:at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\s*[,:]?\s*(.+)?/gi

  while ((match = recurringPattern.exec(text)) !== null) {
    const frequency = match[1].toLowerCase()
    const message = match[5]?.trim() || `${frequency} reminder`

    let triggerAt: Date | null = new Date(now)

    // Parse time if provided
    if (match[2]) {
      let hours = parseInt(match[2], 10)
      const minutes = match[3] ? parseInt(match[3], 10) : 0
      const meridiem = match[4]?.toLowerCase()

      if (meridiem === 'pm' && hours < 12) hours += 12
      if (meridiem === 'am' && hours === 12) hours = 0

      triggerAt.setHours(hours, minutes, 0, 0)
    }

    let recurringPattern = ''
    if (frequency === 'day') recurringPattern = '0 9 * * *' // Daily at 9am
    else if (frequency === 'morning') recurringPattern = '0 8 * * *'
    else if (frequency === 'evening') recurringPattern = '0 18 * * *'
    else if (frequency === 'week') recurringPattern = '0 9 * * 1' // Weekly Monday
    else if (frequency === 'month') recurringPattern = '0 9 1 * *' // Monthly 1st
    else {
      // Day of week
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayIndex = days.indexOf(frequency)
      if (dayIndex !== -1) {
        recurringPattern = `0 9 * * ${dayIndex}` // That day at 9am
      }
    }

    reminders.push({
      id: generateId(),
      message,
      triggerAt,
      type: 'time',
      confidence: 0.75,
      sourceText: match[0],
      isRecurring: true,
      recurringPattern,
    })
  }

  return reminders
}

/**
 * Extract reminders using LLM
 */
export async function extractRemindersWithLLM(
  text: string,
  provider: LLMProvider
): Promise<ExtractedReminder[]> {
  try {
    const result = await provider.complete([
      { role: 'system', content: REMINDER_EXTRACTION_PROMPT },
      { role: 'user', content: text },
    ])

    const parsed = JSON.parse(result.content)
    const reminders: ExtractedReminder[] = []

    for (const r of parsed.reminders ?? []) {
      if (r.message) {
        let triggerAt: Date | null = null
        if (r.datetime) {
          triggerAt = new Date(r.datetime)
          if (isNaN(triggerAt.getTime())) {
            triggerAt = null
          }
        }

        reminders.push({
          id: generateId(),
          message: r.message,
          triggerAt,
          type: r.type ?? 'time',
          confidence: r.confidence ?? 0.8,
          sourceText: r.sourceText ?? text,
          isRecurring: r.isRecurring ?? false,
          recurringPattern: r.recurringPattern,
        })
      }
    }

    return reminders
  } catch (error) {
    console.error('LLM reminder extraction failed:', error)
    return []
  }
}

/**
 * Main reminder extraction function
 * Combines rule-based and LLM-based extraction
 */
export async function extractReminders(
  text: string,
  provider?: LLMProvider
): Promise<ExtractedReminder[]> {
  // Start with rule-based extraction (fast)
  const reminders = extractBasicReminders(text)

  // If provider available, use LLM for more comprehensive extraction
  if (provider) {
    const llmReminders = await extractRemindersWithLLM(text, provider)

    // Merge, avoiding duplicates
    for (const llmReminder of llmReminders) {
      const isDuplicate = reminders.some(
        (r) =>
          r.message.toLowerCase() === llmReminder.message.toLowerCase() ||
          (r.sourceText && llmReminder.sourceText?.includes(r.sourceText))
      )
      if (!isDuplicate) {
        reminders.push(llmReminder)
      }
    }
  }

  return reminders
}
