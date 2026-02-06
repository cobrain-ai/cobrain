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
    const { subscription } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      )
    }

    // Get user agent for device identification
    const userAgent = request.headers.get('user-agent') || undefined

    // Upsert subscription (update if endpoint exists, create if not)
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      update: {
        keys: subscription.keys,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      subscriptionId: pushSubscription.id,
    })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        endpoint: true,
        userAgent: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Get subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    )
  }
}
