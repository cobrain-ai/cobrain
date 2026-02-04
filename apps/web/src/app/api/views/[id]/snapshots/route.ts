import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@cobrain/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/views/[id]/snapshots
 * Get all snapshots for a view
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: viewId } = await params

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

    // Get all snapshots
    const snapshots = await prisma.viewSnapshot.findMany({
      where: { viewId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ snapshots })
  } catch (error) {
    console.error('Get snapshots error:', error)
    return NextResponse.json(
      { error: 'Failed to get snapshots' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/views/[id]/snapshots
 * Create a new snapshot of the view's current data
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: viewId } = await params
    const body = await request.json()
    const { name } = body

    // Get view with query
    const view = await prisma.view.findFirst({
      where: {
        id: viewId,
        userId: session.user.id,
      },
    })

    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Execute the view query to get current notes
    const query = view.query as Record<string, unknown>
    const notes = await executeViewQuery(session.user.id, query)

    // Create snapshot with current data
    const snapshot = await prisma.viewSnapshot.create({
      data: {
        viewId,
        name: name || `Snapshot ${new Date().toLocaleDateString()}`,
        data: JSON.stringify({
          notes,
          viewSettings: {
            name: view.name,
            type: view.type,
            layout: view.layout,
            query: view.query,
          },
          createdAt: new Date().toISOString(),
          noteCount: notes.length,
        }),
      },
    })

    return NextResponse.json({
      snapshot: {
        id: snapshot.id,
        name: snapshot.name,
        createdAt: snapshot.createdAt,
        noteCount: notes.length,
      },
    })
  } catch (error) {
    console.error('Create snapshot error:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    )
  }
}

// Helper function to execute view query
async function executeViewQuery(
  userId: string,
  query: Record<string, unknown>
): Promise<Array<{ id: string; content: string; createdAt: string }>> {
  const where: Record<string, unknown> = { userId }

  // Build where clause from query
  if (query.isPinned !== undefined) {
    where.isPinned = query.isPinned
  }
  if (query.isArchived !== undefined) {
    where.isArchived = query.isArchived
  }
  if (query.search && typeof query.search === 'string') {
    where.content = { contains: query.search }
  }

  const notes = await prisma.note.findMany({
    where: where as Parameters<typeof prisma.note.findMany>[0]['where'],
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      content: true,
      createdAt: true,
      isPinned: true,
      isArchived: true,
    },
  })

  return notes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    isPinned: n.isPinned,
    isArchived: n.isArchived,
  }))
}
