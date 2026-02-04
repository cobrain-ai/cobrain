'use client'

import type { Entity, EntityRelation } from '@cobrain/core'
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_ICONS } from './types'

const DEFAULT_COLOR = '#6B7280'
const DEFAULT_ICON = '📄'

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

interface EntityDetailsPanelProps {
  entity: Entity
  degree: number
  inDegree: number
  outDegree: number
  neighbors: Array<{
    entity: Entity
    relation: EntityRelation
    direction: 'incoming' | 'outgoing'
  }>
  onClose: () => void
  onEntityClick: (entityId: string) => void
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS)
}

export function EntityDetailsPanel({
  entity,
  degree,
  inDegree,
  outDegree,
  neighbors,
  onClose,
  onEntityClick,
}: EntityDetailsPanelProps) {
  const color = ENTITY_TYPE_COLORS[entity.type] || DEFAULT_COLOR
  const icon = ENTITY_TYPE_ICONS[entity.type] || DEFAULT_ICON

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
            >
              {icon}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                {entity.name}
              </h2>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {entity.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Connections
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {degree}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xl font-bold text-green-600">{inDegree}</div>
            <div className="text-xs text-gray-500">Incoming</div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{outDegree}</div>
            <div className="text-xs text-gray-500">Outgoing</div>
          </div>
        </div>
      </div>

      {/* Neighbors list */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Connected Entities ({neighbors.length})
        </h3>
        {neighbors.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            No connections found
          </p>
        ) : (
          <div className="space-y-2">
            {neighbors.map(({ entity: neighbor, relation, direction }) => {
              const neighborColor = ENTITY_TYPE_COLORS[neighbor.type] || DEFAULT_COLOR
              const neighborIcon = ENTITY_TYPE_ICONS[neighbor.type] || DEFAULT_ICON
              return (
                <button
                  key={`${neighbor.id}-${relation.id}`}
                  onClick={() => onEntityClick(neighbor.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      backgroundColor: `${neighborColor}20`,
                      border: `1px solid ${neighborColor}`,
                    }}
                  >
                    {neighborIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {neighbor.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span
                        className={
                          direction === 'incoming'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }
                      >
                        {direction === 'incoming' ? '←' : '→'}
                      </span>
                      <span>{relation.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
        Created {formatDate(entity.createdAt)}
      </div>
    </div>
  )
}
