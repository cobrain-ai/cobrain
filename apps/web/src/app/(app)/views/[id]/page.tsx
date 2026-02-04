'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ListLayout } from '@/components/views/layouts/list-layout'
import { GridLayout } from '@/components/views/layouts/grid-layout'
import { KanbanLayout } from '@/components/views/layouts/kanban-layout'
import { TimelineLayout } from '@/components/views/layouts/timeline-layout'
import { SnapshotPanel } from '@/components/views/snapshot-panel'

interface Note {
  id: string
  content: string
  createdAt: string
  metadata?: {
    isPinned?: boolean
    isArchived?: boolean
  }
}

interface View {
  id: string
  name: string
  description: string | null
  type: string
  layout: string
  query: Record<string, unknown>
  settings: Record<string, unknown>
  isPinned: boolean
  isShared: boolean
  shareToken: string | null
}

interface ViewData {
  notes: Note[]
  total: number
}

export default function ViewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const viewId = params.id as string

  const [view, setView] = useState<View | null>(null)
  const [data, setData] = useState<ViewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLayout, setCurrentLayout] = useState<string>('list')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchView()
  }, [viewId])

  const fetchView = async () => {
    try {
      const response = await fetch(`/api/views?id=${viewId}`)
      if (response.ok) {
        const result = await response.json()
        setView(result.view)
        setData(result.data)
        setCurrentLayout(result.view.layout)
      } else {
        router.push('/views')
      }
    } catch (error) {
      console.error('Failed to fetch view:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const changeLayout = async (layout: string) => {
    setCurrentLayout(layout)
    try {
      await fetch(`/api/views?id=${viewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      })
    } catch (error) {
      console.error('Failed to update layout:', error)
    }
  }

  const [showSnapshots, setShowSnapshots] = useState(false)

  const createSnapshot = async () => {
    const name = prompt('Snapshot name (optional):')
    try {
      const response = await fetch(`/api/views/${viewId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        setShowSnapshots(true)
      }
    } catch (error) {
      console.error('Failed to create snapshot:', error)
    }
  }

  const handleViewSnapshot = async (snapshotId: string) => {
    router.push(`/views/${viewId}/snapshots/${snapshotId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!view || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">View not found</p>
        <Link href="/views" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to Views
        </Link>
      </div>
    )
  }

  const layouts = [
    { id: 'list', label: 'List', icon: <ListIcon /> },
    { id: 'grid', label: 'Grid', icon: <GridIcon /> },
    { id: 'kanban', label: 'Kanban', icon: <KanbanIcon /> },
    { id: 'timeline', label: 'Timeline', icon: <TimelineIcon /> },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/views"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <BackIcon className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {view.name}
            </h1>
            {view.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {view.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => changeLayout(layout.id)}
                className={`p-2 rounded-md transition-colors ${
                  currentLayout === layout.id
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={layout.label}
              >
                {layout.icon}
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={createSnapshot}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Save Snapshot
          </button>
          <button
            onClick={() => setShowSnapshots(!showSnapshots)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              showSnapshots
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            }`}
          >
            Snapshots
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
        <span>{data.total} notes</span>
        <span>|</span>
        <span>Auto-updates in real-time</span>
      </div>

      {/* Snapshots Panel */}
      {showSnapshots && (
        <div className="mb-6">
          <SnapshotPanel viewId={viewId} onViewSnapshot={handleViewSnapshot} />
        </div>
      )}

      {/* Content */}
      {data.notes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <EmptyIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No notes match this view
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create notes that match the view criteria to see them here
          </p>
        </div>
      ) : (
        <>
          {currentLayout === 'list' && <ListLayout notes={data.notes} />}
          {currentLayout === 'grid' && <GridLayout notes={data.notes} />}
          {currentLayout === 'kanban' && <KanbanLayout notes={data.notes} />}
          {currentLayout === 'timeline' && <TimelineLayout notes={data.notes} />}
        </>
      )}
    </div>
  )
}

// Icons
function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function KanbanIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  )
}

function TimelineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
