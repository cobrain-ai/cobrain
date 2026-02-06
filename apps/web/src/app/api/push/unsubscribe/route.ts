import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@cobrain/database'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      )
    }

    // Delete the subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all subscriptions for this user
    const result = await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
    })
  } catch (error) {
    console.error('Push unsubscribe all error:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscriptions' },
      { status: 500 }
    )
  }
}
