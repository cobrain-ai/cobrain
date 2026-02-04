'use client'

import type { EntityType } from '@cobrain/core'
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_ICONS } from './types'
import type { GraphStats } from './types'

interface GraphControlsProps {
  stats: GraphStats | null
  filters: {
    entityTypes: EntityType[]
    search: string
  }
  onFilterChange: (filters: { entityTypes: EntityType[]; search: string }) => void
  onFitView: () => void
  onReset: () => void
}

const ALL_ENTITY_TYPES: EntityType[] = [
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

export function GraphControls({
  stats,
  filters,
  onFilterChange,
  onFitView,
  onReset,
}: GraphControlsProps) {
  const toggleEntityType = (type: EntityType) => {
    const newTypes = filters.entityTypes.includes(type)
      ? filters.entityTypes.filter((t) => t !== type)
      : [...filters.entityTypes, type]
    onFilterChange({ ...filters, entityTypes: newTypes })
  }

  const setSearch = (search: string) => {
    onFilterChange({ ...filters, search })
  }

  const clearFilters = () => {
    onFilterChange({ entityTypes: [], search: '' })
  }

  const hasFilters = filters.entityTypes.length > 0 || filters.search.length > 0

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <input
          type="text"
          placeholder="Search entities..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Entity type filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Filter by type
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ENTITY_TYPES.map((type) => {
            const isActive =
              filters.entityTypes.length === 0 || filters.entityTypes.includes(type)
            const count = stats?.nodesByType[type] || 0
            if (count === 0 && filters.entityTypes.length === 0) return null

            const color = ENTITY_TYPE_COLORS[type]
            const icon = ENTITY_TYPE_ICONS[type]

            return (
              <button
                key={type}
                onClick={() => toggleEntityType(type)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                  transition-all duration-150
                  ${
                    isActive
                      ? 'ring-1 ring-offset-1'
                      : 'opacity-40 hover:opacity-70'
                  }
                `}
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  ringColor: color,
                }}
                title={`${type}: ${count} entities`}
              >
                <span>{icon}</span>
                <span className="capitalize">{type}</span>
                {count > 0 && (
                  <span className="opacity-60">({count})</span>
                )}
              </button>
            )
          })}
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* View controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-2">
        <button
          onClick={onFitView}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Fit view"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          Fit
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Reset view"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Nodes:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.totalNodes}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Edges:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.totalEdges}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg. degree:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.avgDegree.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
