import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { remindersRepository } from '@cobrain/database'

const createReminderSchema = z.object({
  noteId: z.string().uuid(),
  message: z.string().min(1),
  triggerAt: z.string().datetime(),
  type: z.enum(['time', 'commitment', 'follow_up']).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createReminderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { noteId, message, triggerAt, type } = result.data

    const reminder = await remindersRepository.create({
      noteId,
      userId: session.user.id,
      message,
      triggerAt: new Date(triggerAt),
      type,
    })

    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    console.error('Create reminder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'pending' | 'completed' | 'triggered' | 'dismissed' | null
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    const reminders = await remindersRepository.findByUser(session.user.id, {
      status: status ?? undefined,
      limit,
    })

    const count = await remindersRepository.countPending(session.user.id)

    return NextResponse.json({ reminders, pendingCount: count })
  } catch (error) {
    console.error('Get reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
