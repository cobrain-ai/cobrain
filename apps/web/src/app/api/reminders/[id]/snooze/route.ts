import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@cobrain/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

const snoozeSchema = z.object({
  duration: z.enum(['15m', '30m', '1h', '3h', 'tomorrow', 'custom']),
  customTime: z.string().datetime().optional(),
})

/**
 * POST /api/reminders/[id]/snooze
 * Snooze a reminder by updating its triggerAt time and resetting status to pending.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const result = snoozeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { duration, customTime } = result.data

    // Verify reminder belongs to user
    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    // Calculate new trigger time
    let newTriggerAt: Date

    if (duration === 'custom' && customTime) {
      newTriggerAt = new Date(customTime)
    } else {
      newTriggerAt = new Date()

      switch (duration) {
        case '15m':
          newTriggerAt.setMinutes(newTriggerAt.getMinutes() + 15)
          break
        case '30m':
          newTriggerAt.setMinutes(newTriggerAt.getMinutes() + 30)
          break
        case '1h':
          newTriggerAt.setHours(newTriggerAt.getHours() + 1)
          break
        case '3h':
          newTriggerAt.setHours(newTriggerAt.getHours() + 3)
          break
        case 'tomorrow':
          newTriggerAt.setDate(newTriggerAt.getDate() + 1)
          newTriggerAt.setHours(9, 0, 0, 0) // 9 AM tomorrow
          break
      }
    }

    // Update reminder
    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        triggerAt: newTriggerAt,
        status: 'pending',
      },
    })

    return NextResponse.json({
      reminder: {
        id: updated.id,
        message: updated.message,
        triggerAt: updated.triggerAt.toISOString(),
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('Snooze reminder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
