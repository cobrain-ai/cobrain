'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { EntityNodeData } from './types'
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_ICONS } from './types'

// Node sizing constants
const NODE_SIZE = {
  BASE: 48,
  MAX: 80,
  SCALE_FACTOR: 4,
} as const

const DEFAULT_COLOR = '#6B7280'
const DEFAULT_ICON = '📄'

type EntityNodeType = Node<EntityNodeData, 'entity'>

function EntityNodeComponent({ data, selected }: NodeProps<EntityNodeType>) {
  const { entity, degree, isHighlighted } = data
  const color = ENTITY_TYPE_COLORS[entity.type] || DEFAULT_COLOR
  const icon = ENTITY_TYPE_ICONS[entity.type] || DEFAULT_ICON

  // Scale node size based on degree (connections)
  const size = Math.min(
    NODE_SIZE.BASE + degree * NODE_SIZE.SCALE_FACTOR,
    NODE_SIZE.MAX
  )

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-none"
      />
      <div
        className={`
          flex flex-col items-center justify-center
          rounded-full cursor-pointer
          transition-all duration-200 ease-out
          ${selected ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}
          ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}
        `}
        style={{
          width: size,
          height: size,
          backgroundColor: `${color}20`,
          border: `2px solid ${color}`,
          boxShadow: selected
            ? `0 0 20px ${color}40`
            : `0 2px 8px ${color}20`,
        }}
      >
        <span className="text-lg" role="img" aria-label={entity.type}>
          {icon}
        </span>
        {degree > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center
              w-5 h-5 text-xs font-bold rounded-full
              bg-gray-900 dark:bg-white text-white dark:text-gray-900"
          >
            {degree}
          </span>
        )}
      </div>
      <div
        className={`
          absolute -bottom-6 left-1/2 -translate-x-1/2
          text-xs font-medium text-center whitespace-nowrap
          max-w-24 truncate
          ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
        `}
      >
        {entity.name}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-none"
      />
    </>
  )
}

export const EntityNode = memo(EntityNodeComponent)
