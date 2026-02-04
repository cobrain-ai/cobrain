import type { Reminder } from '@cobrain/core'
import { eq, and, lte, sql } from 'drizzle-orm'

import {
  getDatabase,
  generateId,
  reminders,
  type ReminderStatus,
  type ReminderType,
} from '../client.js'

export interface CreateReminderInput {
  noteId: string
  userId: string
  message: string
  triggerAt: Date
  type?: ReminderType
  recurring?: string
  extractedText?: string
}

export interface UpdateReminderInput {
  message?: string
  triggerAt?: Date
  status?: ReminderStatus
}

function toReminder(dbReminder: typeof reminders.$inferSelect): Reminder {
  return {
    id: dbReminder.id,
    noteId: dbReminder.noteId,
    type: dbReminder.type as Reminder['type'],
    triggerAt: dbReminder.triggerAt,
    message: dbReminder.message,
    isCompleted: dbReminder.status === 'completed',
    createdAt: dbReminder.createdAt,
  }
}

export const remindersRepository = {
  async create(input: CreateReminderInput): Promise<Reminder> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(reminders).values({
      id,
      noteId: input.noteId,
      userId: input.userId,
      message: input.message,
      triggerAt: input.triggerAt,
      type: input.type ?? 'time',
      recurring: input.recurring,
      extractedText: input.extractedText,
      createdAt: now,
      updatedAt: now,
    })

    const reminder = await db.select().from(reminders).where(eq(reminders.id, id)).get()
    return toReminder(reminder!)
  },

  async findById(id: string): Promise<Reminder | null> {
    const db = getDatabase()
    const reminder = await db.select().from(reminders).where(eq(reminders.id, id)).get()
    return reminder ? toReminder(reminder) : null
  },

  async findPending(userId: string, before?: Date): Promise<Reminder[]> {
    const db = getDatabase()

    const conditions = [
      eq(reminders.userId, userId),
      eq(reminders.status, 'pending'),
    ]

    if (before) {
      conditions.push(lte(reminders.triggerAt, before))
    }

    const result = await db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(reminders.triggerAt)

    return result.map(toReminder)
  },

  async findByNote(noteId: string): Promise<Reminder[]> {
    const db = getDatabase()

    const result = await db
      .select()
      .from(reminders)
      .where(eq(reminders.noteId, noteId))
      .orderBy(reminders.triggerAt)

    return result.map(toReminder)
  },

  async findByUser(
    userId: string,
    options?: { status?: ReminderStatus; limit?: number }
  ): Promise<Reminder[]> {
    const db = getDatabase()

    const conditions = [eq(reminders.userId, userId)]
    if (options?.status) {
      conditions.push(eq(reminders.status, options.status))
    }

    let query = db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(reminders.triggerAt)

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query
    }

    const result = await query
    return result.map(toReminder)
  },

  async markComplete(id: string): Promise<void> {
    const db = getDatabase()
    await db
      .update(reminders)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(reminders.id, id))
  },

  async markTriggered(id: string): Promise<void> {
    const db = getDatabase()
    await db
      .update(reminders)
      .set({ status: 'triggered', updatedAt: new Date() })
      .where(eq(reminders.id, id))
  },

  async dismiss(id: string): Promise<void> {
    const db = getDatabase()
    await db
      .update(reminders)
      .set({ status: 'dismissed', updatedAt: new Date() })
      .where(eq(reminders.id, id))
  },

  async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    const db = getDatabase()
    const updates: Partial<typeof reminders.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.message !== undefined) updates.message = input.message
    if (input.triggerAt !== undefined) updates.triggerAt = input.triggerAt
    if (input.status !== undefined) updates.status = input.status

    await db.update(reminders).set(updates).where(eq(reminders.id, id))

    const reminder = await db.select().from(reminders).where(eq(reminders.id, id)).get()
    return toReminder(reminder!)
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(reminders).where(eq(reminders.id, id))
  },

  async countPending(userId: string): Promise<number> {
    const db = getDatabase()

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.status, 'pending')
        )
      )
      .get()

    return result?.count ?? 0
  },
}

// Re-export types
export type { ReminderStatus, ReminderType }
