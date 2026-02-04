'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import type { RelationEdgeData } from './types'
import { RELATION_TYPE_STYLES } from './types'

// Edge styling constants
const EDGE_STROKE = {
  WIDTH_DEFAULT: 1.5,
  WIDTH_HIGHLIGHTED: 2.5,
  WIDTH_SELECTED: 3,
  COLOR_HIGHLIGHTED: '#FBBF24',
} as const

type RelationEdgeType = Edge<RelationEdgeData, 'relation'>

function getStrokeWidth(selected: boolean, isHighlighted: boolean): number {
  if (selected) return EDGE_STROKE.WIDTH_SELECTED
  if (isHighlighted) return EDGE_STROKE.WIDTH_HIGHLIGHTED
  return EDGE_STROKE.WIDTH_DEFAULT
}

function RelationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const relation = data?.relation
  const relationType = relation?.type || 'related_to'
  const style = RELATION_TYPE_STYLES[relationType] || RELATION_TYPE_STYLES.related_to
  const isHighlighted = data?.isHighlighted ?? false

  const strokeColor = isHighlighted ? EDGE_STROKE.COLOR_HIGHLIGHTED : style.stroke
  const strokeWidth = getStrokeWidth(selected ?? false, isHighlighted)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
      />
      {selected && relation && (
        <EdgeLabelRenderer>
          <div
            className="
              absolute px-2 py-1 rounded-md text-xs font-medium
              bg-gray-900 dark:bg-white text-white dark:text-gray-900
              pointer-events-none
            "
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {relationType.replace('_', ' ')}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const RelationEdge = memo(RelationEdgeComponent)
