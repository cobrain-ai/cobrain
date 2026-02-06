import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@cobrain/database'

interface RouteParams {
  params: Promise<{ id: string; snapshotId: string }>
}

/**
 * GET /api/views/[id]/snapshots/[snapshotId]
 * Get a specific snapshot with its data
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: viewId, snapshotId } = await params

    // Verify view ownership
    const view = await prisma.view.findFirst({
      where: {
        id: viewId,
        userId: session.user.id,
      },
    })

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Get snapshot
    const snapshot = await prisma.viewSnapshot.findFirst({
      where: {
        id: snapshotId,
        viewId,
      },
    })

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    // Parse snapshot data
    let data
    try {
      data = typeof snapshot.data === 'string' ? JSON.parse(snapshot.data) : snapshot.data
    } catch {
      data = snapshot.data
    }

    return NextResponse.json({
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        createdAt: snapshot.createdAt,
        data,
      },
    })
  } catch (error) {
    console.error('Get snapshot error:', error)
    return NextResponse.json(
      { error: 'Failed to get snapshot' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/views/[id]/snapshots/[snapshotId]
 * Update snapshot name
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: viewId, snapshotId } = await params
    const body = await request.json()
    const { name } = body

    // Verify view ownership
    const view = await prisma.view.findFirst({
      where: {
        id: viewId,
        userId: session.user.id,
      },
    })

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Update snapshot
    const snapshot = await prisma.viewSnapshot.update({
      where: { id: snapshotId },
      data: { name },
    })

    return NextResponse.json({
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        createdAt: snapshot.createdAt,
      },
    })
  } catch (error) {
    console.error('Update snapshot error:', error)
    return NextResponse.json(
      { error: 'Failed to update snapshot' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/views/[id]/snapshots/[snapshotId]
 * Delete a snapshot
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: viewId, snapshotId } = await params

    // Verify view ownership
    const view = await prisma.view.findFirst({
      where: {
        id: viewId,
        userId: session.user.id,
      },
    })

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Delete snapshot
    await prisma.viewSnapshot.delete({
      where: { id: snapshotId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete snapshot error:', error)
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    )
  }
}
