import { eq, desc, and, gt, isNull, or } from 'drizzle-orm'

import { getDatabase, generateId, views, viewSnapshots, shareAccessLogs } from '../client.js'

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
  sharePassword: string | null
  shareExpiresAt: Date | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ShareAccessLog {
  id: string
  viewId: string
  accessedAt: Date
  ipAddress: string | null
  userAgent: string | null
  referrer: string | null
  country: string | null
}

export interface ShareAnalytics {
  totalViews: number
  uniqueVisitors: number
  viewsByDay: { date: string; count: number }[]
  topReferrers: { referrer: string; count: number }[]
  topCountries: { country: string; count: number }[]
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
  sharePassword?: string | null
  shareExpiresAt?: Date | null
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
    sharePassword: dbView.sharePassword ?? null,
    shareExpiresAt: dbView.shareExpiresAt ?? null,
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
    const now = new Date()
    const view = await db
      .select()
      .from(views)
      .where(
        and(
          eq(views.shareToken, token),
          eq(views.isShared, true),
          or(
            isNull(views.shareExpiresAt),
            gt(views.shareExpiresAt, now)
          )
        )
      )
      .get()
    return view ? toView(view) : null
  },

  async isSharePasswordValid(viewId: string, password: string): Promise<boolean> {
    const db = getDatabase()
    const view = await db.select().from(views).where(eq(views.id, viewId)).get()
    if (!view || !view.sharePassword) {
      return true // No password required
    }
    // Simple comparison - in production, use bcrypt
    return view.sharePassword === password
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
    if (input.sharePassword !== undefined) {
      updates.sharePassword = input.sharePassword
    }
    if (input.shareExpiresAt !== undefined) {
      updates.shareExpiresAt = input.shareExpiresAt
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

  // Share Access Analytics
  async logAccess(
    viewId: string,
    info: { ipAddress?: string; userAgent?: string; referrer?: string; country?: string }
  ): Promise<void> {
    const db = getDatabase()
    const id = generateId()
    await db.insert(shareAccessLogs).values({
      id,
      viewId,
      accessedAt: new Date(),
      ipAddress: info.ipAddress ?? null,
      userAgent: info.userAgent ?? null,
      referrer: info.referrer ?? null,
      country: info.country ?? null,
    })
  },

  async getShareAnalytics(viewId: string, days: number = 30): Promise<ShareAnalytics> {
    const db = getDatabase()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const logs = await db
      .select()
      .from(shareAccessLogs)
      .where(
        and(
          eq(shareAccessLogs.viewId, viewId),
          gt(shareAccessLogs.accessedAt, since)
        )
      )
      .orderBy(desc(shareAccessLogs.accessedAt))

    // Calculate analytics
    const totalViews = logs.length
    const uniqueIps = new Set(logs.map((l) => l.ipAddress).filter(Boolean))
    const uniqueVisitors = uniqueIps.size

    // Views by day
    const viewsByDayMap = new Map<string, number>()
    for (const log of logs) {
      const date = log.accessedAt.toISOString().split('T')[0]
      viewsByDayMap.set(date, (viewsByDayMap.get(date) ?? 0) + 1)
    }
    const viewsByDay = Array.from(viewsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top referrers
    const referrerMap = new Map<string, number>()
    for (const log of logs) {
      if (log.referrer) {
        referrerMap.set(log.referrer, (referrerMap.get(log.referrer) ?? 0) + 1)
      }
    }
    const topReferrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top countries
    const countryMap = new Map<string, number>()
    for (const log of logs) {
      if (log.country) {
        countryMap.set(log.country, (countryMap.get(log.country) ?? 0) + 1)
      }
    }
    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalViews,
      uniqueVisitors,
      viewsByDay,
      topReferrers,
      topCountries,
    }
  },
}
