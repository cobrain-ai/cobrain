import { describe, it, expect } from 'vitest'
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_ICONS,
  RELATION_TYPE_STYLES,
  type EntityNodeData,
  type RelationEdgeData,
  type GraphStats,
  type GraphNode,
  type GraphNeighborhood,
} from './types'
import type { EntityType, RelationType } from '@cobrain/core'

describe('Graph Types', () => {
  describe('ENTITY_TYPE_COLORS', () => {
    const entityTypes: EntityType[] = [
      'person',
      'organization',
      'place',
      'project',
      'task',
      'concept',
      'event',
      'date',
      'time',
      'tag',
      'custom',
    ]

    it('should have a color defined for each entity type', () => {
      entityTypes.forEach((type) => {
        expect(ENTITY_TYPE_COLORS[type]).toBeDefined()
        expect(typeof ENTITY_TYPE_COLORS[type]).toBe('string')
      })
    })

    it('should have valid hex color format', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      Object.values(ENTITY_TYPE_COLORS).forEach((color) => {
        expect(color).toMatch(hexColorRegex)
      })
    })

    it('should have unique colors for most entity types', () => {
      const colors = Object.values(ENTITY_TYPE_COLORS)
      const uniqueColors = new Set(colors)
      // date and time share the same color (#6B7280), so we allow one duplicate
      expect(uniqueColors.size).toBeGreaterThanOrEqual(colors.length - 1)
    })
  })

  describe('ENTITY_TYPE_ICONS', () => {
    const entityTypes: EntityType[] = [
      'person',
      'organization',
      'place',
      'project',
      'task',
      'concept',
      'event',
      'date',
      'time',
      'tag',
      'custom',
    ]

    it('should have an icon defined for each entity type', () => {
      entityTypes.forEach((type) => {
        expect(ENTITY_TYPE_ICONS[type]).toBeDefined()
        expect(typeof ENTITY_TYPE_ICONS[type]).toBe('string')
      })
    })

    it('should have non-empty icons', () => {
      Object.values(ENTITY_TYPE_ICONS).forEach((icon) => {
        expect(icon.length).toBeGreaterThan(0)
      })
    })

    it('should return correct icons for specific types', () => {
      expect(ENTITY_TYPE_ICONS.person).toBe('👤')
      expect(ENTITY_TYPE_ICONS.organization).toBe('🏢')
      expect(ENTITY_TYPE_ICONS.place).toBe('📍')
      expect(ENTITY_TYPE_ICONS.project).toBe('📁')
      expect(ENTITY_TYPE_ICONS.task).toBe('✅')
      expect(ENTITY_TYPE_ICONS.concept).toBe('💡')
    })
  })

  describe('RELATION_TYPE_STYLES', () => {
    const relationTypes: RelationType[] = [
      'mentions',
      'related_to',
      'part_of',
      'depends_on',
      'created_by',
      'assigned_to',
      'scheduled_for',
      'tagged_with',
      'similar_to',
      'custom',
    ]

    it('should have a style defined for each relation type', () => {
      relationTypes.forEach((type) => {
        expect(RELATION_TYPE_STYLES[type]).toBeDefined()
        expect(typeof RELATION_TYPE_STYLES[type].stroke).toBe('string')
      })
    })

    it('should have valid hex color format for stroke', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
      Object.values(RELATION_TYPE_STYLES).forEach((style) => {
        expect(style.stroke).toMatch(hexColorRegex)
      })
    })

    it('should have optional strokeDasharray as string when defined', () => {
      Object.values(RELATION_TYPE_STYLES).forEach((style) => {
        if (style.strokeDasharray !== undefined) {
          expect(typeof style.strokeDasharray).toBe('string')
        }
      })
    })

    it('should define dashed styles for certain relation types', () => {
      expect(RELATION_TYPE_STYLES.related_to.strokeDasharray).toBeDefined()
      expect(RELATION_TYPE_STYLES.depends_on.strokeDasharray).toBeDefined()
      expect(RELATION_TYPE_STYLES.tagged_with.strokeDasharray).toBeDefined()
      expect(RELATION_TYPE_STYLES.similar_to.strokeDasharray).toBeDefined()
    })

    it('should have solid lines for direct relations', () => {
      expect(RELATION_TYPE_STYLES.mentions.strokeDasharray).toBeUndefined()
      expect(RELATION_TYPE_STYLES.part_of.strokeDasharray).toBeUndefined()
      expect(RELATION_TYPE_STYLES.created_by.strokeDasharray).toBeUndefined()
    })
  })
})

describe('Type Definitions', () => {
  it('should allow valid EntityNodeData structure', () => {
    const nodeData: EntityNodeData = {
      entity: {
        id: 'entity-1',
        name: 'Test Entity',
        type: 'person',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      degree: 5,
      inDegree: 2,
      outDegree: 3,
      isSelected: true,
      isHighlighted: false,
    }

    expect(nodeData.entity.id).toBe('entity-1')
    expect(nodeData.degree).toBe(5)
  })

  it('should allow optional fields in EntityNodeData', () => {
    const nodeData: EntityNodeData = {
      entity: {
        id: 'entity-1',
        name: 'Test Entity',
        type: 'concept',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      degree: 0,
      inDegree: 0,
      outDegree: 0,
    }

    expect(nodeData.isSelected).toBeUndefined()
    expect(nodeData.isHighlighted).toBeUndefined()
  })

  it('should allow valid RelationEdgeData structure', () => {
    const edgeData: RelationEdgeData = {
      relation: {
        id: 'relation-1',
        sourceId: 'entity-1',
        targetId: 'entity-2',
        type: 'mentions',
        createdAt: new Date(),
      },
      isHighlighted: true,
    }

    expect(edgeData.relation.id).toBe('relation-1')
    expect(edgeData.isHighlighted).toBe(true)
  })

  it('should allow valid GraphStats structure', () => {
    const stats: GraphStats = {
      totalNodes: 100,
      totalEdges: 250,
      nodesByType: {
        person: 30,
        concept: 50,
        project: 20,
      },
      edgesByType: {
        mentions: 100,
        related_to: 150,
      },
      avgDegree: 2.5,
    }

    expect(stats.totalNodes).toBe(100)
    expect(stats.avgDegree).toBe(2.5)
  })

  it('should allow valid GraphNode structure', () => {
    const graphNode: GraphNode = {
      entity: {
        id: 'entity-1',
        name: 'Hub Entity',
        type: 'organization',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      degree: 10,
      inDegree: 4,
      outDegree: 6,
    }

    expect(graphNode.entity.type).toBe('organization')
    expect(graphNode.degree).toBe(graphNode.inDegree + graphNode.outDegree)
  })

  it('should allow valid GraphNeighborhood structure', () => {
    const neighborhood: GraphNeighborhood = {
      center: {
        id: 'center-1',
        name: 'Center Entity',
        type: 'project',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      neighbors: [
        {
          entity: {
            id: 'neighbor-1',
            name: 'Neighbor 1',
            type: 'person',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          relation: {
            id: 'rel-1',
            sourceId: 'center-1',
            targetId: 'neighbor-1',
            type: 'created_by',
            createdAt: new Date(),
          },
          direction: 'outgoing',
        },
        {
          entity: {
            id: 'neighbor-2',
            name: 'Neighbor 2',
            type: 'task',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          relation: {
            id: 'rel-2',
            sourceId: 'neighbor-2',
            targetId: 'center-1',
            type: 'part_of',
            createdAt: new Date(),
          },
          direction: 'incoming',
        },
      ],
    }

    expect(neighborhood.center.id).toBe('center-1')
    expect(neighborhood.neighbors).toHaveLength(2)
    expect(neighborhood.neighbors[0].direction).toBe('outgoing')
    expect(neighborhood.neighbors[1].direction).toBe('incoming')
  })
})
