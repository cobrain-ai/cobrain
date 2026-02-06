import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  viewsRepository,
  notesRepository,
  entitiesRepository,
  type ViewQuery,
} from '@cobrain/database'

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')

    // Find view by share token
    const view = await viewsRepository.findByShareToken(token)

    if (!view || !view.isShared) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 })
    }

    // Check if view has expired
    if (view.shareExpiresAt && new Date(view.shareExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This shared link has expired' },
        { status: 410 }
      )
    }

    // Check password if required
    if (view.sharePassword) {
      if (!password) {
        return NextResponse.json(
          {
            error: 'Password required',
            view: { name: view.name, hasPassword: true },
          },
          { status: 401 }
        )
      }

      const isValid = await viewsRepository.isSharePasswordValid(view.id, password)
      if (!isValid) {
        return NextResponse.json(
          {
            error: 'Invalid password',
            view: { name: view.name, hasPassword: true },
          },
          { status: 401 }
        )
      }
    }

    // Log access
    const headersList = await headers()
    await viewsRepository.logAccess(view.id, {
      ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined,
      userAgent: headersList.get('user-agent') || undefined,
      referrer: headersList.get('referer') || undefined,
    })

    // Execute view query and return data
    const data = await executeViewQuery(view.query, view.userId)

    return NextResponse.json({
      view: {
        id: view.id,
        name: view.name,
        description: view.description,
        type: view.type,
        layout: view.layout,
        createdAt: view.createdAt,
        updatedAt: view.updatedAt,
        hasPassword: !!view.sharePassword,
      },
      data,
    })
  } catch (error) {
    console.error('Get shared view error:', error)
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
    const entities: Array<{ id: string }> = []

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

    const entityIds = [...new Set(entities.map((e) => e.id))]

    if (entityIds.length === 0) {
      return { notes: [], total: 0 }
    }

    const notes = await notesRepository.findByUser({
      userId,
      limit,
      includeArchived: query.isArchived ?? false,
      search: query.search,
    })

    const filtered =
      query.isPinned !== undefined
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
