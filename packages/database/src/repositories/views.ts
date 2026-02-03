import { prisma } from '../client.js'

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

function toView(dbView: {
  id: string
  userId: string
  name: string
  description: string | null
  type: string
  query: unknown
  layout: string
  settings: unknown
  isShared: boolean
  shareToken: string | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}): View {
  return {
    id: dbView.id,
    userId: dbView.userId,
    name: dbView.name,
    description: dbView.description,
    type: dbView.type as ViewType,
    query: (dbView.query as ViewQuery) ?? {},
    layout: dbView.layout as ViewLayout,
    settings: (dbView.settings as ViewSettings) ?? {},
    isShared: dbView.isShared,
    shareToken: dbView.shareToken,
    isPinned: dbView.isPinned,
    createdAt: dbView.createdAt,
    updatedAt: dbView.updatedAt,
  }
}

function toSnapshot(dbSnapshot: {
  id: string
  viewId: string
  name: string | null
  data: unknown
  createdAt: Date
}): ViewSnapshot {
  return {
    id: dbSnapshot.id,
    viewId: dbSnapshot.viewId,
    name: dbSnapshot.name,
    data: dbSnapshot.data,
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
    const view = await prisma.view.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description,
        type: input.type ?? 'custom',
        query: input.query ?? {},
        layout: input.layout ?? 'list',
        settings: input.settings ?? {},
      },
    })
    return toView(view)
  },

  async findById(id: string): Promise<View | null> {
    const view = await prisma.view.findUnique({
      where: { id },
    })
    return view ? toView(view) : null
  },

  async findByShareToken(token: string): Promise<View | null> {
    const view = await prisma.view.findUnique({
      where: { shareToken: token },
    })
    return view && view.isShared ? toView(view) : null
  },

  async findByUser(userId: string): Promise<View[]> {
    const views = await prisma.view.findMany({
      where: { userId },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    })
    return views.map(toView)
  },

  async update(id: string, input: UpdateViewInput): Promise<View> {
    const data: Record<string, unknown> = {}

    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description
    if (input.type !== undefined) data.type = input.type
    if (input.query !== undefined) data.query = input.query
    if (input.layout !== undefined) data.layout = input.layout
    if (input.settings !== undefined) data.settings = input.settings
    if (input.isPinned !== undefined) data.isPinned = input.isPinned
    if (input.isShared !== undefined) {
      data.isShared = input.isShared
      if (input.isShared) {
        // Generate share token if enabling sharing
        const existing = await prisma.view.findUnique({ where: { id } })
        if (!existing?.shareToken) {
          data.shareToken = generateShareToken()
        }
      }
    }

    const view = await prisma.view.update({
      where: { id },
      data,
    })
    return toView(view)
  },

  async delete(id: string): Promise<void> {
    await prisma.view.delete({
      where: { id },
    })
  },

  async regenerateShareToken(id: string): Promise<string> {
    const token = generateShareToken()
    await prisma.view.update({
      where: { id },
      data: { shareToken: token },
    })
    return token
  },

  // Snapshots
  async createSnapshot(
    viewId: string,
    data: unknown,
    name?: string
  ): Promise<ViewSnapshot> {
    const snapshot = await prisma.viewSnapshot.create({
      data: {
        viewId,
        name,
        data: data as any,
      },
    })
    return toSnapshot(snapshot)
  },

  async findSnapshots(viewId: string): Promise<ViewSnapshot[]> {
    const snapshots = await prisma.viewSnapshot.findMany({
      where: { viewId },
      orderBy: { createdAt: 'desc' },
    })
    return snapshots.map(toSnapshot)
  },

  async findSnapshotById(id: string): Promise<ViewSnapshot | null> {
    const snapshot = await prisma.viewSnapshot.findUnique({
      where: { id },
    })
    return snapshot ? toSnapshot(snapshot) : null
  },

  async deleteSnapshot(id: string): Promise<void> {
    await prisma.viewSnapshot.delete({
      where: { id },
    })
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
