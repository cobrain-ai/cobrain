import { describe, it, expect } from 'vitest'
import { extractBasicReminders, extractReminders } from './reminder-extractor.js'

describe('Reminder Extractor', () => {
  describe('extractBasicReminders', () => {
    it('should extract "remind me to X" patterns', () => {
      const text = 'Remind me to call John tomorrow'
      const reminders = extractBasicReminders(text)

      expect(reminders).toHaveLength(1)
      expect(reminders[0].message.toLowerCase()).toContain('call john')
      expect(reminders[0].type).toBe('time')
    })

    it('should extract "remind me to X at Y" patterns', () => {
      const text = 'Remind me to take medicine at 9am'
      const reminders = extractBasicReminders(text)

      expect(reminders).toHaveLength(1)
      expect(reminders[0].message.toLowerCase()).toContain('take medicine')
      expect(reminders[0].triggerAt).toBeDefined()
    })

    it('should extract commitment patterns "I\'ll X by Y"', () => {
      const text = "I'll send the report by Friday"
      const reminders = extractBasicReminders(text)

      expect(reminders).toHaveLength(1)
      expect(reminders[0].message.toLowerCase()).toContain('send the report')
      expect(reminders[0].type).toBe('commitment')
    })

    it('should extract commitment patterns "I will X by Y"', () => {
      const text = 'I will finish the project by tomorrow'
      const reminders = extractBasicReminders(text)

      expect(reminders).toHaveLength(1)
      expect(reminders[0].type).toBe('commitment')
      expect(reminders[0].triggerAt).toBeDefined()
    })

    it('should extract recurring patterns "every X"', () => {
      const text = 'Every Monday at 9am team meeting'
      const reminders = extractBasicReminders(text)

      expect(reminders).toHaveLength(1)
      expect(reminders[0].isRecurring).toBe(true)
      expect(reminders[0].recurringPattern).toBeDefined()
    })

    it('should handle "every day" pattern', () => {
      const text = 'Every day take vitamins'
      const reminders = extractBasicReminders(text)

      expect(reminders).toHaveLength(1)
      expect(reminders[0].isRecurring).toBe(true)
      expect(reminders[0].recurringPattern).toContain('* * *')
    })

    it('should extract multiple reminders', () => {
      const text = 'Remind me to call John tomorrow. I\'ll send the doc by Friday.'
      const reminders = extractBasicReminders(text)

      expect(reminders.length).toBeGreaterThanOrEqual(2)
    })

    it('should include source text', () => {
      const text = 'Remind me to buy milk at 5pm'
      const reminders = extractBasicReminders(text)

      expect(reminders[0].sourceText).toBeDefined()
      expect(reminders[0].sourceText.length).toBeGreaterThan(0)
    })

    it('should assign confidence scores', () => {
      const text = 'Remind me to exercise tomorrow'
      const reminders = extractBasicReminders(text)

      expect(reminders[0].confidence).toBeGreaterThan(0)
      expect(reminders[0].confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('extractReminders (without LLM)', () => {
    it('should extract reminders without provider', async () => {
      const text = 'Remind me to call Mom tomorrow at 2pm'
      const reminders = await extractReminders(text)

      expect(reminders.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle text without reminders', async () => {
      const text = 'This is just a regular note about the weather'
      const reminders = await extractReminders(text)

      expect(reminders).toHaveLength(0)
    })

    it('should handle complex text with multiple patterns', async () => {
      const text = `
        Today I need to:
        - Remind me to submit the report by 5pm
        - I'll call the client by end of week
        - Every morning check emails
      `
      const reminders = await extractReminders(text)

      expect(reminders.length).toBeGreaterThanOrEqual(2)
    })
  })
})
