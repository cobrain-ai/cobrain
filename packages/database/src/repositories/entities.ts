import type { Entity, EntityType, EntityRelation, RelationType } from '@cobrain/core'

import { prisma } from '../client.js'

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

export const entitiesRepository = {
  async create(input: CreateEntityInput): Promise<Entity> {
    const normalizedName = input.name.toLowerCase().trim()

    const entity = await prisma.entity.upsert({
      where: {
        type_normalizedName: {
          type: input.type,
          normalizedName,
        },
      },
      update: {
        metadata: input.metadata ?? {},
      },
      create: {
        type: input.type,
        name: input.name,
        normalizedName,
        metadata: input.metadata ?? {},
      },
    })

    return toEntity(entity)
  },

  async findById(id: string): Promise<Entity | null> {
    const entity = await prisma.entity.findUnique({
      where: { id },
    })
    return entity ? toEntity(entity) : null
  },

  async findByType(type: EntityType): Promise<Entity[]> {
    const entities = await prisma.entity.findMany({
      where: { type },
      orderBy: { name: 'asc' },
    })
    return entities.map(toEntity)
  },

  async findByName(name: string): Promise<Entity[]> {
    const normalizedName = name.toLowerCase().trim()
    const entities = await prisma.entity.findMany({
      where: {
        normalizedName: {
          contains: normalizedName,
        },
      },
    })
    return entities.map(toEntity)
  },

  async findByNote(noteId: string): Promise<Entity[]> {
    const noteEntities = await prisma.noteEntity.findMany({
      where: { noteId },
      include: { entity: true },
    })
    return noteEntities.map((ne) => toEntity(ne.entity))
  },

  async linkToNote(input: LinkEntityToNoteInput): Promise<void> {
    await prisma.noteEntity.upsert({
      where: {
        noteId_entityId: {
          noteId: input.noteId,
          entityId: input.entityId,
        },
      },
      update: {
        confidence: input.confidence ?? 1.0,
        startIndex: input.startIndex,
        endIndex: input.endIndex,
      },
      create: {
        noteId: input.noteId,
        entityId: input.entityId,
        confidence: input.confidence ?? 1.0,
        startIndex: input.startIndex,
        endIndex: input.endIndex,
      },
    })
  },

  async unlinkFromNote(noteId: string, entityId: string): Promise<void> {
    await prisma.noteEntity.delete({
      where: {
        noteId_entityId: {
          noteId,
          entityId,
        },
      },
    })
  },

  async createRelation(input: CreateRelationInput): Promise<EntityRelation> {
    const relation = await prisma.entityRelation.upsert({
      where: {
        fromId_toId_type: {
          fromId: input.fromId,
          toId: input.toId,
          type: input.type,
        },
      },
      update: {
        weight: input.weight ?? 1.0,
        metadata: input.metadata ?? {},
      },
      create: {
        fromId: input.fromId,
        toId: input.toId,
        type: input.type,
        weight: input.weight ?? 1.0,
        metadata: input.metadata ?? {},
      },
    })

    return toRelation(relation)
  },

  async findRelations(entityId: string): Promise<EntityRelation[]> {
    const relations = await prisma.entityRelation.findMany({
      where: {
        OR: [{ fromId: entityId }, { toId: entityId }],
      },
    })
    return relations.map(toRelation)
  },

  async deleteRelation(id: string): Promise<void> {
    await prisma.entityRelation.delete({
      where: { id },
    })
  },

  async delete(id: string): Promise<void> {
    await prisma.entity.delete({
      where: { id },
    })
  },
}
