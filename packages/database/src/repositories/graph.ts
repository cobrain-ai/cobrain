import type { Entity, EntityType, EntityRelation, RelationType } from '@cobrain/core'
import { eq, and, or, inArray, sql } from 'drizzle-orm'

import {
  getDatabase,
  getSqlite,
  entities,
  entityRelations,
  noteEntities,
} from '../client.js'

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

function toEntity(dbEntity: typeof entities.$inferSelect): Entity {
  return {
    id: dbEntity.id,
    type: dbEntity.type as EntityType,
    name: dbEntity.name,
    metadata: parseJson<Record<string, unknown>>(dbEntity.metadata),
    createdAt: dbEntity.createdAt,
    updatedAt: dbEntity.updatedAt,
  }
}

function toRelation(dbRelation: typeof entityRelations.$inferSelect): EntityRelation {
  return {
    id: dbRelation.id,
    sourceId: dbRelation.fromId,
    targetId: dbRelation.toId,
    type: dbRelation.type as RelationType,
    weight: dbRelation.weight,
    metadata: parseJson<Record<string, unknown>>(dbRelation.metadata),
    createdAt: dbRelation.createdAt,
  }
}

export const graphRepository = {
  /**
   * Get graph statistics
   */
  async getStats(): Promise<GraphStats> {
    const db = getDatabase()

    const [nodeCountResult, edgeCountResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(entities).get(),
      db.select({ count: sql<number>`count(*)` }).from(entityRelations).get(),
    ])

    const nodeCount = nodeCountResult?.count ?? 0
    const edgeCount = edgeCountResult?.count ?? 0

    // Get counts by type
    const allEntities = await db.select({ type: entities.type }).from(entities)
    const allRelations = await db.select({ type: entityRelations.type }).from(entityRelations)

    const nodesByType: Record<string, number> = {}
    for (const e of allEntities) {
      nodesByType[e.type] = (nodesByType[e.type] ?? 0) + 1
    }

    const edgesByType: Record<string, number> = {}
    for (const r of allRelations) {
      edgesByType[r.type] = (edgesByType[r.type] ?? 0) + 1
    }

    return {
      totalNodes: nodeCount,
      totalEdges: edgeCount,
      nodesByType,
      edgesByType,
      avgDegree: nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0,
    }
  },

  /**
   * Get a node with its degree information
   */
  async getNode(entityId: string): Promise<GraphNode | null> {
    const db = getDatabase()

    const entity = await db.select().from(entities).where(eq(entities.id, entityId)).get()
    if (!entity) return null

    const [inDegreeResult, outDegreeResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(entityRelations).where(eq(entityRelations.toId, entityId)).get(),
      db.select({ count: sql<number>`count(*)` }).from(entityRelations).where(eq(entityRelations.fromId, entityId)).get(),
    ])

    const inDegree = inDegreeResult?.count ?? 0
    const outDegree = outDegreeResult?.count ?? 0

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
    const db = getDatabase()

    const entity = await db.select().from(entities).where(eq(entities.id, entityId)).get()
    if (!entity) return null

    // Build conditions
    const outgoingConditions = [eq(entityRelations.fromId, entityId)]
    const incomingConditions = [eq(entityRelations.toId, entityId)]

    if (options.relationTypes?.length) {
      outgoingConditions.push(inArray(entityRelations.type, options.relationTypes))
      incomingConditions.push(inArray(entityRelations.type, options.relationTypes))
    }
    if (options.minWeight !== undefined) {
      // Note: Drizzle doesn't have gte, use raw SQL or adjust logic
    }

    let outgoingQuery = db.select().from(entityRelations).where(and(...outgoingConditions))
    let incomingQuery = db.select().from(entityRelations).where(and(...incomingConditions))

    if (options.limit) {
      outgoingQuery = outgoingQuery.limit(options.limit) as typeof outgoingQuery
      incomingQuery = incomingQuery.limit(options.limit) as typeof incomingQuery
    }

    const [outgoing, incoming] = await Promise.all([outgoingQuery, incomingQuery])

    // Get related entities
    const relatedIds = new Set<string>()
    for (const rel of outgoing) relatedIds.add(rel.toId)
    for (const rel of incoming) relatedIds.add(rel.fromId)

    const relatedEntities = relatedIds.size > 0
      ? await db.select().from(entities).where(inArray(entities.id, [...relatedIds]))
      : []
    const entityMap = new Map(relatedEntities.map((e) => [e.id, toEntity(e)]))

    const neighbors: GraphNeighborhood['neighbors'] = []

    for (const rel of outgoing) {
      const neighborEntity = entityMap.get(rel.toId)
      if (!neighborEntity) continue
      if (options.entityTypes?.length && !options.entityTypes.includes(neighborEntity.type)) continue

      neighbors.push({
        entity: neighborEntity,
        relation: toRelation(rel),
        direction: 'outgoing',
      })
    }

    for (const rel of incoming) {
      const neighborEntity = entityMap.get(rel.fromId)
      if (!neighborEntity) continue
      if (options.entityTypes?.length && !options.entityTypes.includes(neighborEntity.type)) continue

      neighbors.push({
        entity: neighborEntity,
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
    const db = getDatabase()
    const maxDepth = options.maxDepth ?? 3
    const visited = new Map<string, { entity: Entity; depth: number }>()
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current.id) || current.depth > maxDepth) continue

      const entity = await db.select().from(entities).where(eq(entities.id, current.id)).get()
      if (!entity) continue

      if (options.entityTypes?.length && !options.entityTypes.includes(entity.type as EntityType)) {
        continue
      }

      visited.set(current.id, { entity: toEntity(entity), depth: current.depth })

      if (current.depth < maxDepth) {
        const conditions = [
          or(
            eq(entityRelations.fromId, current.id),
            eq(entityRelations.toId, current.id)
          ),
        ]

        if (options.relationTypes?.length) {
          conditions.push(inArray(entityRelations.type, options.relationTypes))
        }

        const relations = await db
          .select()
          .from(entityRelations)
          .where(and(...conditions))

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
    const db = getDatabase()
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
        const pathEntities = await db
          .select()
          .from(entities)
          .where(inArray(entities.id, current.path))

        const nodeMap = new Map(pathEntities.map((n) => [n.id, toEntity(n)]))
        return {
          nodes: current.path.map((id) => nodeMap.get(id)!).filter(Boolean),
          edges: current.edges,
          totalWeight: current.totalWeight,
        }
      }

      if (visited.has(current.id) || current.path.length > maxDepth) continue
      visited.add(current.id)

      const conditions = [
        or(
          eq(entityRelations.fromId, current.id),
          eq(entityRelations.toId, current.id)
        ),
      ]

      if (options.relationTypes?.length) {
        conditions.push(inArray(entityRelations.type, options.relationTypes))
      }

      const relations = await db
        .select()
        .from(entityRelations)
        .where(and(...conditions))

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
    const db = getDatabase()
    const sqlite = getSqlite()
    const limit = options.limit ?? 20
    const minOccurrences = options.minOccurrences ?? 1

    // Use raw SQL for complex aggregation
    const result = sqlite.prepare(`
      SELECT ne2.entity_id as entityId, COUNT(*) as count
      FROM note_entities ne1
      JOIN note_entities ne2 ON ne1.note_id = ne2.note_id AND ne1.entity_id != ne2.entity_id
      WHERE ne1.entity_id = ?
      GROUP BY ne2.entity_id
      HAVING count >= ?
      ORDER BY count DESC
      LIMIT ?
    `).all(entityId, minOccurrences, limit) as Array<{ entityId: string; count: number }>

    if (result.length === 0) return []

    const entityIds = result.map((r) => r.entityId)
    const entitiesData = await db
      .select()
      .from(entities)
      .where(inArray(entities.id, entityIds))

    const entityMap = new Map(entitiesData.map((e) => [e.id, toEntity(e)]))

    return result
      .map((r) => ({
        entity: entityMap.get(r.entityId)!,
        occurrences: r.count,
      }))
      .filter((r) => r.entity)
  },

  /**
   * Get entities with the most connections (hubs)
   */
  async getHubs(limit: number = 10): Promise<GraphNode[]> {
    const db = getDatabase()
    const sqlite = getSqlite()

    // Use raw SQL for complex aggregation
    const result = sqlite.prepare(`
      SELECT
        e.id,
        COALESCE(out_deg.count, 0) as outDegree,
        COALESCE(in_deg.count, 0) as inDegree,
        COALESCE(out_deg.count, 0) + COALESCE(in_deg.count, 0) as degree
      FROM entities e
      LEFT JOIN (
        SELECT from_id, COUNT(*) as count FROM entity_relations GROUP BY from_id
      ) out_deg ON e.id = out_deg.from_id
      LEFT JOIN (
        SELECT to_id, COUNT(*) as count FROM entity_relations GROUP BY to_id
      ) in_deg ON e.id = in_deg.to_id
      ORDER BY degree DESC
      LIMIT ?
    `).all(limit) as Array<{ id: string; outDegree: number; inDegree: number; degree: number }>

    if (result.length === 0) return []

    const entityIds = result.map((r) => r.id)
    const entitiesData = await db
      .select()
      .from(entities)
      .where(inArray(entities.id, entityIds))

    const entityMap = new Map(entitiesData.map((e) => [e.id, toEntity(e)]))

    return result
      .map((r) => ({
        entity: entityMap.get(r.id)!,
        degree: r.degree,
        inDegree: r.inDegree,
        outDegree: r.outDegree,
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
    const db = getDatabase()
    const maxDepth = options.maxDepth ?? 2

    // Get entities directly linked to this note
    const noteEntityLinks = await db
      .select()
      .from(noteEntities)
      .where(eq(noteEntities.noteId, noteId))

    if (noteEntityLinks.length === 0) {
      return { directEntities: [], relatedEntities: [], relations: [] }
    }

    const directIds = noteEntityLinks.map((ne) => ne.entityId)
    const directEntitiesData = await db
      .select()
      .from(entities)
      .where(inArray(entities.id, directIds))

    const directEntities = directEntitiesData.map(toEntity)

    // Get related entities via graph traversal
    const directIdsSet = new Set(directIds)
    const relatedEntities: Entity[] = []
    const allRelations: EntityRelation[] = []

    for (const entity of directEntities) {
      const neighborhood = await this.bfs(entity.id, { ...options, maxDepth })
      for (const [id, data] of neighborhood) {
        if (!directIdsSet.has(id) && data.depth > 0 && data.depth <= maxDepth) {
          if (!relatedEntities.some((e) => e.id === id)) {
            relatedEntities.push(data.entity)
          }
        }
      }

      // Get relations from direct entities
      const relations = await db
        .select()
        .from(entityRelations)
        .where(
          or(
            eq(entityRelations.fromId, entity.id),
            eq(entityRelations.toId, entity.id)
          )
        )

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
    const db = getDatabase()
    const sqlite = getSqlite()

    // Find entity pairs that appear together in notes but don't have relations
    const result = sqlite.prepare(`
      SELECT ne1.entity_id as entityId1, ne2.entity_id as entityId2, COUNT(*) as count
      FROM note_entities ne1
      JOIN note_entities ne2 ON ne1.note_id = ne2.note_id AND ne1.entity_id < ne2.entity_id
      LEFT JOIN entity_relations er ON
        (er.from_id = ne1.entity_id AND er.to_id = ne2.entity_id) OR
        (er.from_id = ne2.entity_id AND er.to_id = ne1.entity_id)
      WHERE er.id IS NULL
      GROUP BY ne1.entity_id, ne2.entity_id
      HAVING COUNT(*) >= ?
      ORDER BY count DESC
      LIMIT 50
    `).all(minCoOccurrences) as Array<{ entityId1: string; entityId2: string; count: number }>

    if (result.length === 0) return []

    const entityIds = new Set<string>()
    for (const r of result) {
      entityIds.add(r.entityId1)
      entityIds.add(r.entityId2)
    }

    const entitiesData = await db
      .select()
      .from(entities)
      .where(inArray(entities.id, [...entityIds]))

    const entityMap = new Map(entitiesData.map((e) => [e.id, toEntity(e)]))

    return result
      .map((r) => ({
        from: entityMap.get(r.entityId1)!,
        to: entityMap.get(r.entityId2)!,
        occurrences: r.count,
      }))
      .filter((s) => s.from && s.to)
  },
}
