import { eq, desc } from 'drizzle-orm'

import { getDatabase, generateId, views, viewSnapshots } from '../client.js'

export type ViewLayout = 'list' | 'grid' | 'timeline' | 'kanban' | 'graph'
export type ViewType = 'custom' | 'projects' | 'tasks' | 'people' | 'timeline' | 'recent' | 'pinned'

export interface ViewQuery {
  entityTypes?: string[]
  entityNames?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
  search?: string
  tags?: string[]
  isPinned?: boolean
  isArchived?: boolean
  limit?: number
}

export interface ViewSettings {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  groupBy?: string
  showArchived?: boolean
  columns?: string[]
}

export interface View {
  id: string
  userId: string
  name: string
  description: string | null
  type: ViewType
  query: ViewQuery
  layout: ViewLayout
  settings: ViewSettings
  isShared: boolean
  shareToken: string | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ViewSnapshot {
  id: string
  viewId: string
  name: string | null
  data: unknown
  createdAt: Date
}

export interface CreateViewInput {
  userId: string
  name: string
  description?: string
  type?: ViewType
  query?: ViewQuery
  layout?: ViewLayout
  settings?: ViewSettings
}

export interface UpdateViewInput {
  name?: string
  description?: string
  type?: ViewType
  query?: ViewQuery
  layout?: ViewLayout
  settings?: ViewSettings
  isShared?: boolean
  isPinned?: boolean
}

function parseJson<T>(value: unknown): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return {} as T
    }
  }
  return (value ?? {}) as T
}

function toView(dbView: typeof views.$inferSelect): View {
  return {
    id: dbView.id,
    userId: dbView.userId,
    name: dbView.name,
    description: dbView.description,
    type: dbView.type as ViewType,
    query: parseJson<ViewQuery>(dbView.query),
    layout: dbView.layout as ViewLayout,
    settings: parseJson<ViewSettings>(dbView.settings),
    isShared: dbView.isShared,
    shareToken: dbView.shareToken,
    isPinned: dbView.isPinned,
    createdAt: dbView.createdAt,
    updatedAt: dbView.updatedAt,
  }
}

function toSnapshot(dbSnapshot: typeof viewSnapshots.$inferSelect): ViewSnapshot {
  return {
    id: dbSnapshot.id,
    viewId: dbSnapshot.viewId,
    name: dbSnapshot.name,
    data: parseJson(dbSnapshot.data),
    createdAt: dbSnapshot.createdAt,
  }
}

function generateShareToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const viewsRepository = {
  async create(input: CreateViewInput): Promise<View> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(views).values({
      id,
      userId: input.userId,
      name: input.name,
      description: input.description,
      type: input.type ?? 'custom',
      query: JSON.stringify(input.query ?? {}),
      layout: input.layout ?? 'list',
      settings: JSON.stringify(input.settings ?? {}),
      createdAt: now,
      updatedAt: now,
    })

    const view = await db.select().from(views).where(eq(views.id, id)).get()
    return toView(view!)
  },

  async findById(id: string): Promise<View | null> {
    const db = getDatabase()
    const view = await db.select().from(views).where(eq(views.id, id)).get()
    return view ? toView(view) : null
  },

  async findByShareToken(token: string): Promise<View | null> {
    const db = getDatabase()
    const view = await db.select().from(views).where(eq(views.shareToken, token)).get()
    return view && view.isShared ? toView(view) : null
  },

  async findByUser(userId: string): Promise<View[]> {
    const db = getDatabase()
    const result = await db
      .select()
      .from(views)
      .where(eq(views.userId, userId))
      .orderBy(desc(views.isPinned), desc(views.updatedAt))

    return result.map(toView)
  },

  async update(id: string, input: UpdateViewInput): Promise<View> {
    const db = getDatabase()
    const updates: Partial<typeof views.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.name !== undefined) updates.name = input.name
    if (input.description !== undefined) updates.description = input.description
    if (input.type !== undefined) updates.type = input.type
    if (input.query !== undefined) updates.query = JSON.stringify(input.query)
    if (input.layout !== undefined) updates.layout = input.layout
    if (input.settings !== undefined) updates.settings = JSON.stringify(input.settings)
    if (input.isPinned !== undefined) updates.isPinned = input.isPinned
    if (input.isShared !== undefined) {
      updates.isShared = input.isShared
      if (input.isShared) {
        // Generate share token if enabling sharing
        const existing = await db.select().from(views).where(eq(views.id, id)).get()
        if (!existing?.shareToken) {
          updates.shareToken = generateShareToken()
        }
      }
    }

    await db.update(views).set(updates).where(eq(views.id, id))

    const view = await db.select().from(views).where(eq(views.id, id)).get()
    return toView(view!)
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(views).where(eq(views.id, id))
  },

  async regenerateShareToken(id: string): Promise<string> {
    const db = getDatabase()
    const token = generateShareToken()
    await db.update(views).set({ shareToken: token }).where(eq(views.id, id))
    return token
  },

  // Snapshots
  async createSnapshot(
    viewId: string,
    data: unknown,
    name?: string
  ): Promise<ViewSnapshot> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date()

    await db.insert(viewSnapshots).values({
      id,
      viewId,
      name,
      data: JSON.stringify(data),
      createdAt: now,
    })

    const snapshot = await db.select().from(viewSnapshots).where(eq(viewSnapshots.id, id)).get()
    return toSnapshot(snapshot!)
  },

  async findSnapshots(viewId: string): Promise<ViewSnapshot[]> {
    const db = getDatabase()
    const result = await db
      .select()
      .from(viewSnapshots)
      .where(eq(viewSnapshots.viewId, viewId))
      .orderBy(desc(viewSnapshots.createdAt))

    return result.map(toSnapshot)
  },

  async findSnapshotById(id: string): Promise<ViewSnapshot | null> {
    const db = getDatabase()
    const snapshot = await db.select().from(viewSnapshots).where(eq(viewSnapshots.id, id)).get()
    return snapshot ? toSnapshot(snapshot) : null
  },

  async deleteSnapshot(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(viewSnapshots).where(eq(viewSnapshots.id, id))
  },

  // View templates (pre-defined views)
  getTemplates(): Array<{
    type: ViewType
    name: string
    description: string
    query: ViewQuery
    layout: ViewLayout
  }> {
    return [
      {
        type: 'projects',
        name: 'Active Projects',
        description: 'All project-related notes',
        query: { entityTypes: ['project'] },
        layout: 'kanban',
      },
      {
        type: 'tasks',
        name: 'Tasks & Todos',
        description: 'Notes with tasks and action items',
        query: { entityTypes: ['task'] },
        layout: 'list',
      },
      {
        type: 'people',
        name: 'People',
        description: 'Notes organized by people mentioned',
        query: { entityTypes: ['person'] },
        layout: 'grid',
      },
      {
        type: 'timeline',
        name: 'Timeline',
        description: 'Notes on a timeline view',
        query: {},
        layout: 'timeline',
      },
      {
        type: 'recent',
        name: 'Recent Notes',
        description: 'Most recently created notes',
        query: { limit: 20 },
        layout: 'list',
      },
      {
        type: 'pinned',
        name: 'Pinned Notes',
        description: 'All pinned notes',
        query: { isPinned: true },
        layout: 'grid',
      },
    ]
  },
}
