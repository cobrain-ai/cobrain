import type { Entity, EntityType, EntityRelation, RelationType } from '@cobrain/core'
import { eq, and, like, inArray, or } from 'drizzle-orm'

import {
  getDatabase,
  generateId,
  entities,
  noteEntities,
  entityRelations,
} from '../client.js'

export interface CreateEntityInput {
  type: EntityType
  name: string
  metadata?: Record<string, unknown>
}

export interface LinkEntityToNoteInput {
  noteId: string
  entityId: string
  confidence?: number
  startIndex?: number
  endIndex?: number
}

export interface CreateRelationInput {
  fromId: string
  toId: string
  type: RelationType
  weight?: number
  metadata?: Record<string, unknown>
}

function toEntity(dbEntity: typeof entities.$inferSelect): Entity {
  return {
    id: dbEntity.id,
    type: dbEntity.type as EntityType,
    name: dbEntity.name,
    metadata: (typeof dbEntity.metadata === 'string'
      ? JSON.parse(dbEntity.metadata)
      : dbEntity.metadata) as Record<string, unknown> ?? {},
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
    metadata: (typeof dbRelation.metadata === 'string'
      ? JSON.parse(dbRelation.metadata)
      : dbRelation.metadata) as Record<string, unknown> ?? {},
    createdAt: dbRelation.createdAt,
  }
}

export const entitiesRepository = {
  async create(input: CreateEntityInput): Promise<Entity> {
    const db = getDatabase()
    const normalizedName = input.name.toLowerCase().trim()

    // Check if entity exists
    const existing = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.type, input.type),
          eq(entities.normalizedName, normalizedName)
        )
      )
      .get()

    if (existing) {
      // Update existing
      await db
        .update(entities)
        .set({
          metadata: JSON.stringify(input.metadata ?? {}),
          updatedAt: new Date(),
        })
        .where(eq(entities.id, existing.id))

      const updated = await db.select().from(entities).where(eq(entities.id, existing.id)).get()
      return toEntity(updated!)
    }

    // Create new
    const id = generateId()
    const now = new Date()

    await db.insert(entities).values({
      id,
      type: input.type,
      name: input.name,
      normalizedName,
      metadata: JSON.stringify(input.metadata ?? {}),
      createdAt: now,
      updatedAt: now,
    })

    const entity = await db.select().from(entities).where(eq(entities.id, id)).get()
    return toEntity(entity!)
  },

  async findById(id: string): Promise<Entity | null> {
    const db = getDatabase()
    const entity = await db.select().from(entities).where(eq(entities.id, id)).get()
    return entity ? toEntity(entity) : null
  },

  async findByType(type: EntityType): Promise<Entity[]> {
    const db = getDatabase()
    const result = await db
      .select()
      .from(entities)
      .where(eq(entities.type, type))
      .orderBy(entities.name)

    return result.map(toEntity)
  },

  async findByName(name: string): Promise<Entity[]> {
    const db = getDatabase()
    const normalizedName = name.toLowerCase().trim()

    const result = await db
      .select()
      .from(entities)
      .where(like(entities.normalizedName, `%${normalizedName}%`))

    return result.map(toEntity)
  },

  async findByNote(noteId: string): Promise<Entity[]> {
    const db = getDatabase()

    const links = await db
      .select()
      .from(noteEntities)
      .where(eq(noteEntities.noteId, noteId))

    if (links.length === 0) return []

    const entityIds = links.map((l) => l.entityId)
    const result = await db
      .select()
      .from(entities)
      .where(inArray(entities.id, entityIds))

    return result.map(toEntity)
  },

  async linkToNote(input: LinkEntityToNoteInput): Promise<void> {
    const db = getDatabase()

    // Check if link exists
    const existing = await db
      .select()
      .from(noteEntities)
      .where(
        and(
          eq(noteEntities.noteId, input.noteId),
          eq(noteEntities.entityId, input.entityId)
        )
      )
      .get()

    if (existing) {
      // Update existing
      await db
        .update(noteEntities)
        .set({
          confidence: input.confidence ?? 1.0,
          startIndex: input.startIndex,
          endIndex: input.endIndex,
        })
        .where(eq(noteEntities.id, existing.id))
    } else {
      // Create new
      await db.insert(noteEntities).values({
        id: generateId(),
        noteId: input.noteId,
        entityId: input.entityId,
        confidence: input.confidence ?? 1.0,
        startIndex: input.startIndex,
        endIndex: input.endIndex,
      })
    }
  },

  async unlinkFromNote(noteId: string, entityId: string): Promise<void> {
    const db = getDatabase()
    await db
      .delete(noteEntities)
      .where(
        and(
          eq(noteEntities.noteId, noteId),
          eq(noteEntities.entityId, entityId)
        )
      )
  },

  async createRelation(input: CreateRelationInput): Promise<EntityRelation> {
    const db = getDatabase()

    // Check if relation exists
    const existing = await db
      .select()
      .from(entityRelations)
      .where(
        and(
          eq(entityRelations.fromId, input.fromId),
          eq(entityRelations.toId, input.toId),
          eq(entityRelations.type, input.type)
        )
      )
      .get()

    if (existing) {
      // Update existing
      await db
        .update(entityRelations)
        .set({
          weight: input.weight ?? 1.0,
          metadata: JSON.stringify(input.metadata ?? {}),
        })
        .where(eq(entityRelations.id, existing.id))

      const updated = await db
        .select()
        .from(entityRelations)
        .where(eq(entityRelations.id, existing.id))
        .get()
      return toRelation(updated!)
    }

    // Create new
    const id = generateId()
    const now = new Date()

    await db.insert(entityRelations).values({
      id,
      fromId: input.fromId,
      toId: input.toId,
      type: input.type,
      weight: input.weight ?? 1.0,
      metadata: JSON.stringify(input.metadata ?? {}),
      createdAt: now,
    })

    const relation = await db
      .select()
      .from(entityRelations)
      .where(eq(entityRelations.id, id))
      .get()
    return toRelation(relation!)
  },

  async findRelations(entityId: string): Promise<EntityRelation[]> {
    const db = getDatabase()

    const result = await db
      .select()
      .from(entityRelations)
      .where(
        or(
          eq(entityRelations.fromId, entityId),
          eq(entityRelations.toId, entityId)
        )
      )

    return result.map(toRelation)
  },

  async deleteRelation(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(entityRelations).where(eq(entityRelations.id, id))
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase()
    await db.delete(entities).where(eq(entities.id, id))
  },
}
