import type { Entity, EntityRelation, EntityType, RelationType } from '@cobrain/core'

// React Flow node data
export interface EntityNodeData {
  entity: Entity
  degree: number
  inDegree: number
  outDegree: number
  isSelected?: boolean
  isHighlighted?: boolean
  [key: string]: unknown
}

// React Flow edge data
export interface RelationEdgeData {
  relation: EntityRelation
  isHighlighted?: boolean
  [key: string]: unknown
}

// Graph API response types
export interface GraphStats {
  totalNodes: number
  totalEdges: number
  nodesByType: Record<string, number>
  edgesByType: Record<string, number>
  avgDegree: number
}

export interface GraphNode {
  entity: Entity
  degree: number
  inDegree: number
  outDegree: number
}

export interface GraphNeighborhood {
  center: Entity
  neighbors: Array<{
    entity: Entity
    relation: EntityRelation
    direction: 'incoming' | 'outgoing'
  }>
}

// Entity type color mapping
export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  person: '#3B82F6', // blue
  organization: '#8B5CF6', // purple
  place: '#10B981', // green
  project: '#F59E0B', // orange
  task: '#EF4444', // red
  concept: '#06B6D4', // cyan
  event: '#EC4899', // pink
  date: '#6B7280', // gray
  time: '#6B7280', // gray
  tag: '#14B8A6', // teal
  custom: '#A855F7', // violet
}

// Entity type icons (emoji)
export const ENTITY_TYPE_ICONS: Record<EntityType, string> = {
  person: '👤',
  organization: '🏢',
  place: '📍',
  project: '📁',
  task: '✅',
  concept: '💡',
  event: '📅',
  date: '📆',
  time: '🕐',
  tag: '🏷️',
  custom: '⭐',
}

// Relation type styles
export const RELATION_TYPE_STYLES: Record<
  RelationType,
  { stroke: string; strokeDasharray?: string; animated?: boolean }
> = {
  mentions: { stroke: '#94A3B8' },
  related_to: { stroke: '#94A3B8', strokeDasharray: '5 5' },
  part_of: { stroke: '#64748B' },
  depends_on: { stroke: '#F59E0B', strokeDasharray: '3 3' },
  created_by: { stroke: '#10B981' },
  assigned_to: { stroke: '#3B82F6' },
  scheduled_for: { stroke: '#8B5CF6' },
  tagged_with: { stroke: '#14B8A6', strokeDasharray: '2 2' },
  similar_to: { stroke: '#EC4899', strokeDasharray: '5 5' },
  custom: { stroke: '#A855F7' },
}
