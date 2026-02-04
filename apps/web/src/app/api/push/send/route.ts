import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@cobrain/database'

// Note: In production, you would use the 'web-push' library
// For now, this demonstrates the API structure

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    reminderId?: string
    noteId?: string
    url?: string
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, payload } = body as { userId?: string; payload: PushPayload }

    // Determine target user (self if not specified)
    const targetUserId = userId || session.user.id

    // Only allow sending to self unless admin
    if (targetUserId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: targetUserId,
      },
    })

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found' },
        { status: 404 }
      )
    }

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushNotification(sub, payload))
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    // Clean up failed subscriptions (expired endpoints)
    const failedSubscriptions = results
      .map((r, i) => (r.status === 'rejected' ? subscriptions[i] : null))
      .filter(Boolean)

    if (failedSubscriptions.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          id: {
            in: failedSubscriptions.map((s) => s!.id),
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      cleaned: failedSubscriptions.length,
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

interface Subscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

async function sendPushNotification(
  subscription: { endpoint: string; keys: unknown },
  payload: PushPayload
): Promise<void> {
  const keys = subscription.keys as { p256dh: string; auth: string }

  // Get VAPID keys from environment
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@cobrain.ai'

  if (!vapidPublicKey || !vapidPrivateKey) {
    // In development without VAPID keys, just log the notification
    console.log('[Push] Would send notification:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      payload,
    })

    // Simulate success in development
    if (process.env.NODE_ENV === 'development') {
      return
    }

    throw new Error('VAPID keys not configured')
  }

  // In production, use web-push library:
  // const webpush = require('web-push')
  // webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  // await webpush.sendNotification(
  //   { endpoint: subscription.endpoint, keys },
  //   JSON.stringify(payload)
  // )

  // For now, just log in development
  console.log('[Push] Notification sent:', payload.title)
}
