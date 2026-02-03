import type { Entity, EntityType, EntityRelation, RelationType } from '@cobrain/core'

import { prisma } from '../client.js'

// Graph traversal and analytics for the knowledge graph

export interface GraphNode {
  entity: Entity
  degree: number // total connections
  inDegree: number // incoming connections
  outDegree: number // outgoing connections
}

export interface GraphPath {
  nodes: Entity[]
  edges: EntityRelation[]
  totalWeight: number
}

export interface GraphNeighborhood {
  center: Entity
  neighbors: Array<{
    entity: Entity
    relation: EntityRelation
    direction: 'incoming' | 'outgoing'
  }>
}

export interface GraphStats {
  totalNodes: number
  totalEdges: number
  nodesByType: Record<string, number>
  edgesByType: Record<string, number>
  avgDegree: number
}

export interface TraversalOptions {
  maxDepth?: number
  relationTypes?: RelationType[]
  entityTypes?: EntityType[]
  minWeight?: number
  limit?: number
}

function toEntity(dbEntity: {
  id: string
  type: string
  name: string
  metadata: unknown
  createdAt: Date
  updatedAt: Date
}): Entity {
  return {
    id: dbEntity.id,
    type: dbEntity.type as EntityType,
    name: dbEntity.name,
    metadata: (dbEntity.metadata as Record<string, unknown>) ?? {},
    createdAt: dbEntity.createdAt,
    updatedAt: dbEntity.updatedAt,
  }
}

function toRelation(dbRelation: {
  id: string
  fromId: string
  toId: string
  type: string
  weight: number
  metadata: unknown
  createdAt: Date
}): EntityRelation {
  return {
    id: dbRelation.id,
    sourceId: dbRelation.fromId,
    targetId: dbRelation.toId,
    type: dbRelation.type as RelationType,
    weight: dbRelation.weight,
    metadata: (dbRelation.metadata as Record<string, unknown>) ?? {},
    createdAt: dbRelation.createdAt,
  }
}

export const graphRepository = {
  /**
   * Get graph statistics
   */
  async getStats(): Promise<GraphStats> {
    const [nodeCount, edgeCount, nodesByType, edgesByType] = await Promise.all([
      prisma.entity.count(),
      prisma.entityRelation.count(),
      prisma.entity.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.entityRelation.groupBy({
        by: ['type'],
        _count: true,
      }),
    ])

    const nodesByTypeMap: Record<string, number> = {}
    for (const item of nodesByType) {
      nodesByTypeMap[item.type] = item._count
    }

    const edgesByTypeMap: Record<string, number> = {}
    for (const item of edgesByType) {
      edgesByTypeMap[item.type] = item._count
    }

    return {
      totalNodes: nodeCount,
      totalEdges: edgeCount,
      nodesByType: nodesByTypeMap,
      edgesByType: edgesByTypeMap,
      avgDegree: nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0,
    }
  },

  /**
   * Get a node with its degree information
   */
  async getNode(entityId: string): Promise<GraphNode | null> {
    const [entity, inDegree, outDegree] = await Promise.all([
      prisma.entity.findUnique({ where: { id: entityId } }),
      prisma.entityRelation.count({ where: { toId: entityId } }),
      prisma.entityRelation.count({ where: { fromId: entityId } }),
    ])

    if (!entity) return null

    return {
      entity: toEntity(entity),
      degree: inDegree + outDegree,
      inDegree,
      outDegree,
    }
  },

  /**
   * Get immediate neighbors of an entity
   */
  async getNeighborhood(
    entityId: string,
    options: TraversalOptions = {}
  ): Promise<GraphNeighborhood | null> {
    const entity = await prisma.entity.findUnique({ where: { id: entityId } })
    if (!entity) return null

    const relationFilter: Record<string, unknown> = {}
    if (options.relationTypes?.length) {
      relationFilter.type = { in: options.relationTypes }
    }
    if (options.minWeight !== undefined) {
      relationFilter.weight = { gte: options.minWeight }
    }

    const [outgoing, incoming] = await Promise.all([
      prisma.entityRelation.findMany({
        where: { fromId: entityId, ...relationFilter },
        include: { toEntity: true },
        take: options.limit,
      }),
      prisma.entityRelation.findMany({
        where: { toId: entityId, ...relationFilter },
        include: { fromEntity: true },
        take: options.limit,
      }),
    ])

    const neighbors: GraphNeighborhood['neighbors'] = []

    for (const rel of outgoing) {
      if (options.entityTypes?.length && !options.entityTypes.includes(rel.toEntity.type as EntityType)) {
        continue
      }
      neighbors.push({
        entity: toEntity(rel.toEntity),
        relation: toRelation(rel),
        direction: 'outgoing',
      })
    }

    for (const rel of incoming) {
      if (options.entityTypes?.length && !options.entityTypes.includes(rel.fromEntity.type as EntityType)) {
        continue
      }
      neighbors.push({
        entity: toEntity(rel.fromEntity),
        relation: toRelation(rel),
        direction: 'incoming',
      })
    }

    return {
      center: toEntity(entity),
      neighbors,
    }
  },

  /**
   * Breadth-first search to find all entities within N hops
   */
  async bfs(
    startId: string,
    options: TraversalOptions = {}
  ): Promise<Map<string, { entity: Entity; depth: number }>> {
    const maxDepth = options.maxDepth ?? 3
    const visited = new Map<string, { entity: Entity; depth: number }>()
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id) || current.depth > maxDepth) continue

      const entity = await prisma.entity.findUnique({ where: { id: current.id } })
      if (!entity) continue

      if (options.entityTypes?.length && !options.entityTypes.includes(entity.type as EntityType)) {
        continue
      }

      visited.set(current.id, { entity: toEntity(entity), depth: current.depth })

      if (current.depth < maxDepth) {
        const relationFilter: Record<string, unknown> = {}
        if (options.relationTypes?.length) {
          relationFilter.type = { in: options.relationTypes }
        }
        if (options.minWeight !== undefined) {
          relationFilter.weight = { gte: options.minWeight }
        }

        const relations = await prisma.entityRelation.findMany({
          where: {
            OR: [{ fromId: current.id }, { toId: current.id }],
            ...relationFilter,
          },
        })

        for (const rel of relations) {
          const neighborId = rel.fromId === current.id ? rel.toId : rel.fromId
          if (!visited.has(neighborId)) {
            queue.push({ id: neighborId, depth: current.depth + 1 })
          }
        }
      }
    }

    return visited
  },

  /**
   * Find shortest path between two entities using BFS
   */
  async findPath(
    fromId: string,
    toId: string,
    options: TraversalOptions = {}
  ): Promise<GraphPath | null> {
    const maxDepth = options.maxDepth ?? 6
    const visited = new Set<string>()
    const queue: Array<{
      id: string
      path: string[]
      edges: EntityRelation[]
      totalWeight: number
    }> = [{ id: fromId, path: [fromId], edges: [], totalWeight: 0 }]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.id === toId) {
        // Found the target - reconstruct path
        const nodes = await prisma.entity.findMany({
          where: { id: { in: current.path } },
        })
        const nodeMap = new Map(nodes.map((n) => [n.id, toEntity(n)]))
        return {
          nodes: current.path.map((id) => nodeMap.get(id)!).filter(Boolean),
          edges: current.edges,
          totalWeight: current.totalWeight,
        }
      }

      if (visited.has(current.id) || current.path.length > maxDepth) continue
      visited.add(current.id)

      const relationFilter: Record<string, unknown> = {}
      if (options.relationTypes?.length) {
        relationFilter.type = { in: options.relationTypes }
      }
      if (options.minWeight !== undefined) {
        relationFilter.weight = { gte: options.minWeight }
      }

      const relations = await prisma.entityRelation.findMany({
        where: {
          OR: [{ fromId: current.id }, { toId: current.id }],
          ...relationFilter,
        },
      })

      for (const rel of relations) {
        const neighborId = rel.fromId === current.id ? rel.toId : rel.fromId
        if (!visited.has(neighborId)) {
          queue.push({
            id: neighborId,
            path: [...current.path, neighborId],
            edges: [...current.edges, toRelation(rel)],
            totalWeight: current.totalWeight + rel.weight,
          })
        }
      }
    }

    return null // No path found
  },

  /**
   * Find entities that co-occur with the given entity in the same notes
   */
  async findCoOccurring(
    entityId: string,
    options: { limit?: number; minOccurrences?: number } = {}
  ): Promise<Array<{ entity: Entity; occurrences: number }>> {
    const limit = options.limit ?? 20
    const minOccurrences = options.minOccurrences ?? 1

    // Find all notes containing this entity
    const noteEntities = await prisma.noteEntity.findMany({
      where: { entityId },
      select: { noteId: true },
    })
    const noteIds = noteEntities.map((ne) => ne.noteId)

    if (noteIds.length === 0) return []

    // Find other entities in these notes
    const coOccurring = await prisma.noteEntity.groupBy({
      by: ['entityId'],
      where: {
        noteId: { in: noteIds },
        entityId: { not: entityId },
      },
      _count: true,
      having: {
        entityId: {
          _count: { gte: minOccurrences },
        },
      },
      orderBy: {
        _count: {
          entityId: 'desc',
        },
      },
      take: limit,
    })

    const entityIds = coOccurring.map((c) => c.entityId)
    const entities = await prisma.entity.findMany({
      where: { id: { in: entityIds } },
    })
    const entityMap = new Map(entities.map((e) => [e.id, toEntity(e)]))

    return coOccurring
      .map((c) => ({
        entity: entityMap.get(c.entityId)!,
        occurrences: c._count,
      }))
      .filter((c) => c.entity)
  },

  /**
   * Get entities with the most connections (hubs)
   */
  async getHubs(limit: number = 10): Promise<GraphNode[]> {
    // Get entities with most outgoing + incoming relations
    const outDegrees = await prisma.entityRelation.groupBy({
      by: ['fromId'],
      _count: true,
    })
    const inDegrees = await prisma.entityRelation.groupBy({
      by: ['toId'],
      _count: true,
    })

    const degreeMap = new Map<string, { in: number; out: number }>()
    for (const d of outDegrees) {
      const existing = degreeMap.get(d.fromId) ?? { in: 0, out: 0 }
      existing.out = d._count
      degreeMap.set(d.fromId, existing)
    }
    for (const d of inDegrees) {
      const existing = degreeMap.get(d.toId) ?? { in: 0, out: 0 }
      existing.in = d._count
      degreeMap.set(d.toId, existing)
    }

    // Sort by total degree
    const sorted = [...degreeMap.entries()]
      .map(([id, degrees]) => ({
        id,
        inDegree: degrees.in,
        outDegree: degrees.out,
        degree: degrees.in + degrees.out,
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, limit)

    const entityIds = sorted.map((s) => s.id)
    const entities = await prisma.entity.findMany({
      where: { id: { in: entityIds } },
    })
    const entityMap = new Map(entities.map((e) => [e.id, toEntity(e)]))

    return sorted
      .map((s) => ({
        entity: entityMap.get(s.id)!,
        degree: s.degree,
        inDegree: s.inDegree,
        outDegree: s.outDegree,
      }))
      .filter((n) => n.entity)
  },

  /**
   * Find all entities related to a note through extracted entities
   */
  async getNotesGraphContext(
    noteId: string,
    options: TraversalOptions = {}
  ): Promise<{
    directEntities: Entity[]
    relatedEntities: Entity[]
    relations: EntityRelation[]
  }> {
    const maxDepth = options.maxDepth ?? 2

    // Get entities directly linked to this note
    const noteEntities = await prisma.noteEntity.findMany({
      where: { noteId },
      include: { entity: true },
    })
    const directEntities = noteEntities.map((ne) => toEntity(ne.entity))

    if (directEntities.length === 0) {
      return { directEntities: [], relatedEntities: [], relations: [] }
    }

    // Get related entities via graph traversal
    const directIds = new Set(directEntities.map((e) => e.id))
    const relatedEntities: Entity[] = []
    const allRelations: EntityRelation[] = []

    for (const entity of directEntities) {
      const neighborhood = await this.bfs(entity.id, { ...options, maxDepth })
      for (const [id, data] of neighborhood) {
        if (!directIds.has(id) && data.depth > 0 && data.depth <= maxDepth) {
          if (!relatedEntities.some((e) => e.id === id)) {
            relatedEntities.push(data.entity)
          }
        }
      }

      // Get relations from direct entities
      const relations = await prisma.entityRelation.findMany({
        where: {
          OR: [{ fromId: entity.id }, { toId: entity.id }],
        },
      })
      for (const rel of relations) {
        if (!allRelations.some((r) => r.id === rel.id)) {
          allRelations.push(toRelation(rel))
        }
      }
    }

    return {
      directEntities,
      relatedEntities,
      relations: allRelations,
    }
  },

  /**
   * Auto-create relations between entities that frequently co-occur
   */
  async suggestRelations(
    minCoOccurrences: number = 3
  ): Promise<Array<{ from: Entity; to: Entity; occurrences: number }>> {
    // Find entity pairs that appear together in notes but don't have relations
    const coOccurrences = await prisma.$queryRaw<
      Array<{ entityId1: string; entityId2: string; count: bigint }>
    >`
      SELECT ne1.entityId as entityId1, ne2.entityId as entityId2, COUNT(*) as count
      FROM NoteEntity ne1
      JOIN NoteEntity ne2 ON ne1.noteId = ne2.noteId AND ne1.entityId < ne2.entityId
      LEFT JOIN EntityRelation er ON
        (er.fromId = ne1.entityId AND er.toId = ne2.entityId) OR
        (er.fromId = ne2.entityId AND er.toId = ne1.entityId)
      WHERE er.id IS NULL
      GROUP BY ne1.entityId, ne2.entityId
      HAVING COUNT(*) >= ${minCoOccurrences}
      ORDER BY count DESC
      LIMIT 50
    `

    const entityIds = new Set<string>()
    for (const c of coOccurrences) {
      entityIds.add(c.entityId1)
      entityIds.add(c.entityId2)
    }

    const entities = await prisma.entity.findMany({
      where: { id: { in: [...entityIds] } },
    })
    const entityMap = new Map(entities.map((e) => [e.id, toEntity(e)]))

    return coOccurrences
      .map((c) => ({
        from: entityMap.get(c.entityId1)!,
        to: entityMap.get(c.entityId2)!,
        occurrences: Number(c.count),
      }))
      .filter((s) => s.from && s.to)
  },
}
