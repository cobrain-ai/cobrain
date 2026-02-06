import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@cobrain/database'

/**
 * GET /api/reminders/upcoming
 * Get upcoming reminders for the next N hours.
 */
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') ?? '24', 10)

    const now = new Date()
    const until = new Date(now.getTime() + hours * 60 * 60 * 1000)

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: session.user.id,
        status: 'pending',
        triggerAt: {
          gt: now,
          lte: until,
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
      take: 20,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = reminders.map((r: any) => ({
      id: r.id,
      message: r.message,
      triggerAt: r.triggerAt.toISOString(),
      type: r.type,
      noteId: r.noteId,
      notePreview: r.note.content.slice(0, 100) + (r.note.content.length > 100 ? '...' : ''),
    }))

    return NextResponse.json({ reminders: formatted })
  } catch (error) {
    console.error('Get upcoming reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
