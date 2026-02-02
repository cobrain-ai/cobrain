import type { Entity, EntityRelation } from '@cobrain/core'
import { generateId } from '@cobrain/core'

import type { EntitiesRepository } from './types.js'

export function createEntitiesRepository(db: unknown): EntitiesRepository {
  return {
    async create(data) {
      const now = new Date()
      const entity: Entity = {
        id: generateId(),
        type: data.type,
        name: data.name,
        metadata: data.metadata,
        createdAt: now,
        updatedAt: now,
      }

      // TODO: Implement SQLite insert
      return entity
    },

    async findById(id) {
      // TODO: Implement SQLite query
      return null
    },

    async findByType(type) {
      // TODO: Implement SQLite query
      return []
    },

    async findByName(name) {
      // TODO: Implement SQLite query
      return []
    },

    async update(id, data) {
      const existing = await this.findById(id)
      if (!existing) {
        throw new Error(`Entity not found: ${id}`)
      }

      const updated: Entity = {
        ...existing,
        ...data,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
      }

      // TODO: Implement SQLite update
      return updated
    },

    async delete(id) {
      // TODO: Implement SQLite delete
    },

    async createRelation(data) {
      const relation: EntityRelation = {
        id: generateId(),
        sourceId: data.sourceId,
        targetId: data.targetId,
        type: data.type,
        weight: data.weight,
        metadata: data.metadata,
        createdAt: new Date(),
      }

      // TODO: Implement SQLite insert
      return relation
    },

    async findRelations(entityId) {
      // TODO: Implement SQLite query for relations
      return []
    },

    async deleteRelation(id) {
      // TODO: Implement SQLite delete
    },
  }
}
