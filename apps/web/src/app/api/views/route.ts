import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  viewsRepository,
  notesRepository,
  entitiesRepository,
  type ViewQuery,
} from '@cobrain/database'

const viewQuerySchema = z.object({
  entityTypes: z.array(z.string()).optional(),
  entityNames: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  limit: z.number().min(1).max(200).optional(),
})

const viewSettingsSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  groupBy: z.string().optional(),
  showArchived: z.boolean().optional(),
  columns: z.array(z.string()).optional(),
})

const createViewSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z
    .enum(['custom', 'projects', 'tasks', 'people', 'timeline', 'recent', 'pinned'])
    .optional(),
  query: viewQuerySchema.optional(),
  layout: z.enum(['list', 'grid', 'timeline', 'kanban', 'graph']).optional(),
  settings: viewSettingsSchema.optional(),
})

const updateViewSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z
    .enum(['custom', 'projects', 'tasks', 'people', 'timeline', 'recent', 'pinned'])
    .optional(),
  query: viewQuerySchema.optional(),
  layout: z.enum(['list', 'grid', 'timeline', 'kanban', 'graph']).optional(),
  settings: viewSettingsSchema.optional(),
  isShared: z.boolean().optional(),
  isPinned: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const viewId = searchParams.get('id')
    const shareToken = searchParams.get('share')
    const action = searchParams.get('action')

    // Get view templates
    if (action === 'templates') {
      const templates = viewsRepository.getTemplates()
      return NextResponse.json({ templates })
    }

    // Get shared view by token (public endpoint)
    if (shareToken) {
      const view = await viewsRepository.findByShareToken(shareToken)
      // Return 404 if view doesn't exist or sharing is disabled
      if (!view || !view.isShared) {
        return NextResponse.json({ error: 'View not found' }, { status: 404 })
      }
      // Execute view query and return data
      const data = await executeViewQuery(view.query, view.userId)
      return NextResponse.json({ view, data })
    }

    // Get specific view
    if (viewId) {
      const view = await viewsRepository.findById(viewId)
      if (!view || view.userId !== session.user.id) {
        return NextResponse.json({ error: 'View not found' }, { status: 404 })
      }

      // Execute view query
      const data = await executeViewQuery(view.query, session.user.id)

      // Get snapshots
      const snapshots = await viewsRepository.findSnapshots(viewId)

      return NextResponse.json({ view, data, snapshots })
    }

    // Get all user's views
    const views = await viewsRepository.findByUser(session.user.id)
    return NextResponse.json({ views })
  } catch (error) {
    console.error('Get views error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // Create snapshot
    if (action === 'snapshot') {
      const { viewId, name } = body
      if (!viewId) {
        return NextResponse.json(
          { error: 'viewId is required' },
          { status: 400 }
        )
      }

      const view = await viewsRepository.findById(viewId)
      if (!view || view.userId !== session.user.id) {
        return NextResponse.json({ error: 'View not found' }, { status: 404 })
      }

      // Execute query and save snapshot
      const data = await executeViewQuery(view.query, session.user.id)
      const snapshot = await viewsRepository.createSnapshot(viewId, data, name)

      return NextResponse.json({ snapshot }, { status: 201 })
    }

    // Create view from template
    if (action === 'fromTemplate') {
      const { templateType } = body
      const templates = viewsRepository.getTemplates()
      const template = templates.find((t) => t.type === templateType)

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      const view = await viewsRepository.create({
        userId: session.user.id,
        name: template.name,
        description: template.description,
        type: template.type,
        query: template.query,
        layout: template.layout,
      })

      return NextResponse.json({ view }, { status: 201 })
    }

    // Create custom view
    const result = createViewSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const view = await viewsRepository.create({
      userId: session.user.id,
      ...result.data,
    })

    return NextResponse.json({ view }, { status: 201 })
  } catch (error) {
    console.error('Create view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const viewId = searchParams.get('id')

    if (!viewId) {
      return NextResponse.json({ error: 'View id required' }, { status: 400 })
    }

    const existingView = await viewsRepository.findById(viewId)
    if (!existingView || existingView.userId !== session.user.id) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    const body = await request.json()

    // Regenerate share token
    if (body.action === 'regenerateToken') {
      const token = await viewsRepository.regenerateShareToken(viewId)
      return NextResponse.json({ shareToken: token })
    }

    const result = updateViewSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const view = await viewsRepository.update(viewId, result.data)
    return NextResponse.json({ view })
  } catch (error) {
    console.error('Update view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const viewId = searchParams.get('id')
    const snapshotId = searchParams.get('snapshotId')

    if (snapshotId) {
      // Delete snapshot
      const snapshot = await viewsRepository.findSnapshotById(snapshotId)
      if (!snapshot) {
        return NextResponse.json(
          { error: 'Snapshot not found' },
          { status: 404 }
        )
      }

      // Verify ownership through view
      const view = await viewsRepository.findById(snapshot.viewId)
      if (!view || view.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      await viewsRepository.deleteSnapshot(snapshotId)
      return NextResponse.json({ success: true })
    }

    if (!viewId) {
      return NextResponse.json({ error: 'View id required' }, { status: 400 })
    }

    const view = await viewsRepository.findById(viewId)
    if (!view || view.userId !== session.user.id) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    await viewsRepository.delete(viewId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Execute a view query and return matching notes
async function executeViewQuery(query: ViewQuery, userId: string) {
  const limit = query.limit ?? 50

  // If filtering by entity types or names, get notes through entities
  if (
    (query.entityTypes && query.entityTypes.length > 0) ||
    (query.entityNames && query.entityNames.length > 0)
  ) {
    // Get entities matching criteria
    let entities: Array<{ id: string }> = []

    if (query.entityTypes && query.entityTypes.length > 0) {
      for (const type of query.entityTypes) {
        const typeEntities = await entitiesRepository.findByType(type as any)
        entities.push(...typeEntities)
      }
    }

    if (query.entityNames && query.entityNames.length > 0) {
      for (const name of query.entityNames) {
        const nameEntities = await entitiesRepository.findByName(name)
        entities.push(...nameEntities)
      }
    }

    // Dedupe entity IDs
    const entityIds = [...new Set(entities.map((e) => e.id))]

    if (entityIds.length === 0) {
      return { notes: [], total: 0 }
    }

    // This would need a more complex query to find notes by entity IDs
    // For now, return basic notes filtered by user
    const notes = await notesRepository.findByUser({
      userId,
      limit,
      includeArchived: query.isArchived ?? false,
      search: query.search,
    })

    // Filter by isPinned if specified
    const filtered = query.isPinned !== undefined
      ? notes.filter((n) => n.metadata?.isPinned === query.isPinned)
      : notes

    return {
      notes: filtered,
      total: filtered.length,
      entityIds,
    }
  }

  // Basic query without entity filtering
  const notes = await notesRepository.findByUser({
    userId,
    limit,
    includeArchived: query.isArchived ?? false,
    search: query.search,
  })

  // Apply date range filter
  let filtered = notes
  if (query.dateRange) {
    const { start, end } = query.dateRange
    filtered = notes.filter((note) => {
      const noteDate = new Date(note.createdAt)
      if (start && noteDate < new Date(start)) return false
      if (end && noteDate > new Date(end)) return false
      return true
    })
  }

  // Filter by isPinned if specified
  if (query.isPinned !== undefined) {
    filtered = filtered.filter((n) => n.metadata?.isPinned === query.isPinned)
  }

  return {
    notes: filtered,
    total: filtered.length,
  }
}
