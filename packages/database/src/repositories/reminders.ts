import type { Reminder } from '@cobrain/core'
import type { ReminderStatus, ReminderType } from '@prisma/client'

import { prisma } from '../client.js'

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

function toReminder(dbReminder: {
  id: string
  noteId: string
  message: string
  triggerAt: Date
  type: ReminderType
  status: ReminderStatus
  createdAt: Date
}): Reminder {
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
    const reminder = await prisma.reminder.create({
      data: {
        noteId: input.noteId,
        userId: input.userId,
        message: input.message,
        triggerAt: input.triggerAt,
        type: input.type ?? 'time',
        recurring: input.recurring,
        extractedText: input.extractedText,
      },
    })
    return toReminder(reminder)
  },

  async findById(id: string): Promise<Reminder | null> {
    const reminder = await prisma.reminder.findUnique({
      where: { id },
    })
    return reminder ? toReminder(reminder) : null
  },

  async findPending(userId: string, before?: Date): Promise<Reminder[]> {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        ...(before && {
          triggerAt: {
            lte: before,
          },
        }),
      },
      orderBy: { triggerAt: 'asc' },
    })
    return reminders.map(toReminder)
  },

  async findByNote(noteId: string): Promise<Reminder[]> {
    const reminders = await prisma.reminder.findMany({
      where: { noteId },
      orderBy: { triggerAt: 'asc' },
    })
    return reminders.map(toReminder)
  },

  async findByUser(
    userId: string,
    options?: { status?: ReminderStatus; limit?: number }
  ): Promise<Reminder[]> {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
      },
      orderBy: { triggerAt: 'asc' },
      take: options?.limit,
    })
    return reminders.map(toReminder)
  },

  async markComplete(id: string): Promise<void> {
    await prisma.reminder.update({
      where: { id },
      data: { status: 'completed' },
    })
  },

  async markTriggered(id: string): Promise<void> {
    await prisma.reminder.update({
      where: { id },
      data: { status: 'triggered' },
    })
  },

  async dismiss(id: string): Promise<void> {
    await prisma.reminder.update({
      where: { id },
      data: { status: 'dismissed' },
    })
  },

  async update(id: string, input: UpdateReminderInput): Promise<Reminder> {
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(input.message !== undefined && { message: input.message }),
        ...(input.triggerAt !== undefined && { triggerAt: input.triggerAt }),
        ...(input.status !== undefined && { status: input.status }),
      },
    })
    return toReminder(reminder)
  },

  async delete(id: string): Promise<void> {
    await prisma.reminder.delete({
      where: { id },
    })
  },

  async countPending(userId: string): Promise<number> {
    return prisma.reminder.count({
      where: {
        userId,
        status: 'pending',
      },
    })
  },
}
