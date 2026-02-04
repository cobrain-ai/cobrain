import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@cobrain/database'

interface ReminderWithNote {
  id: string
  message: string
  noteId: string
  note: {
    id: string
    content: string
  }
}

/**
 * GET /api/reminders/check
 * Check for due reminders and mark them as triggered.
 * Called by the frontend scheduler every 30 seconds.
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()

    // Find all pending reminders that are due
    const dueReminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: 'pending',
        triggerAt: {
          lte: now,
        },
      },
      include: {
        note: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: {
        triggerAt: 'asc',
      },
    })

    // Mark them as triggered
    if (dueReminders.length > 0) {
      await prisma.reminder.updateMany({
        where: {
          id: {
            in: dueReminders.map((r: { id: string }) => r.id),
          },
        },
        data: {
          status: 'triggered',
        },
      })

      // Send push notifications for each reminder (non-blocking)
      sendPushNotifications(userId, dueReminders).catch((err) =>
        console.error('Push notification error:', err)
      )
    }

    // Format response with note preview
    const reminders = dueReminders.map((r) => ({
      id: r.id,
      message: r.message,
      triggerAt: r.triggerAt.toISOString(),
      type: r.type,
      noteId: r.noteId,
      notePreview: r.note.content.slice(0, 150) + (r.note.content.length > 150 ? '...' : ''),
      recurring: r.recurring,
    }))

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Check reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Send push notifications for due reminders
 */
async function sendPushNotifications(userId: string, reminders: ReminderWithNote[]) {
  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  if (subscriptions.length === 0) {
    return // No subscriptions, skip push
  }

  // Send notifications for each reminder
  for (const reminder of reminders) {
    const payload = {
      title: 'CoBrain Reminder',
      body: reminder.message,
      tag: `reminder-${reminder.id}`,
      data: {
        reminderId: reminder.id,
        noteId: reminder.noteId,
      },
    }

    // In production, use web-push library
    // For now, log the notification
    console.log('[Push] Sending notification:', payload.title, 'to', subscriptions.length, 'subscriptions')

    // Future implementation with web-push:
    // const webpush = require('web-push')
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification(
    //     { endpoint: sub.endpoint, keys: sub.keys },
    //     JSON.stringify(payload)
    //   )
    // }
  }
}
