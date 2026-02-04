'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ListLayout } from '@/components/views/layouts/list-layout'
import { GridLayout } from '@/components/views/layouts/grid-layout'
import { KanbanLayout } from '@/components/views/layouts/kanban-layout'
import { TimelineLayout } from '@/components/views/layouts/timeline-layout'

interface Note {
  id: string
  content: string
  createdAt: string
  isPinned?: boolean
  isArchived?: boolean
}

interface SnapshotData {
  notes: Note[]
  viewSettings: {
    name: string
    type: string
    layout: string
    query: Record<string, unknown>
  }
  createdAt: string
  noteCount: number
}

interface Snapshot {
  id: string
  name: string
  createdAt: string
  data: SnapshotData
}

export default function SnapshotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const viewId = params.id as string
  const snapshotId = params.snapshotId as string

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLayout, setCurrentLayout] = useState<string>('list')

  useEffect(() => {
    fetchSnapshot()
  }, [viewId, snapshotId])

  const fetchSnapshot = async () => {
    try {
      const response = await fetch(`/api/views/${viewId}/snapshots/${snapshotId}`)
      if (response.ok) {
        const data = await response.json()
        setSnapshot(data.snapshot)
        setCurrentLayout(data.snapshot.data?.viewSettings?.layout || 'list')
      } else {
        router.push(`/views/${viewId}`)
      }
    } catch (error) {
      console.error('Failed to fetch snapshot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Snapshot not found</p>
        <Link href={`/views/${viewId}`} className="text-blue-500 hover:underline mt-2 inline-block">
          Back to View
        </Link>
      </div>
    )
  }

  const notes = snapshot.data?.notes || []
  const viewSettings = snapshot.data?.viewSettings

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
            href={`/views/${viewId}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <BackIcon className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {snapshot.name}
              </h1>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                Snapshot
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Captured on {formatDate(snapshot.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => setCurrentLayout(layout.id)}
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
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <span className="text-xl">📸</span>
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100">
              This is a frozen snapshot
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              This view shows {notes.length} notes as they were on {formatDate(snapshot.createdAt)}.
              It will not update with new changes.
            </p>
            {viewSettings && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                Original view: <strong>{viewSettings.name}</strong> ({viewSettings.type})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {notes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <EmptyIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            This snapshot is empty
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            There were no notes in this view when the snapshot was created
          </p>
        </div>
      ) : (
        <>
          {currentLayout === 'list' && <ListLayout notes={notes} />}
          {currentLayout === 'grid' && <GridLayout notes={notes} />}
          {currentLayout === 'kanban' && <KanbanLayout notes={notes} />}
          {currentLayout === 'timeline' && <TimelineLayout notes={notes} />}
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

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
