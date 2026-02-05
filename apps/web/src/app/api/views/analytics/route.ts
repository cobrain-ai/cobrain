import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { viewsRepository } from '@cobrain/database'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const viewId = searchParams.get('id')
    const days = parseInt(searchParams.get('days') || '30', 10)

    if (!viewId) {
      return NextResponse.json({ error: 'View id required' }, { status: 400 })
    }

    // Verify ownership
    const view = await viewsRepository.findById(viewId)
    if (!view || view.userId !== session.user.id) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    const analytics = await viewsRepository.getShareAnalytics(viewId, days)
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
