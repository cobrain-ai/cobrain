'use client'

import { useState, useEffect, useCallback } from 'react'

interface Snapshot {
  id: string
  name: string
  createdAt: string
  noteCount?: number
}

interface SnapshotPanelProps {
  viewId: string
  onViewSnapshot: (snapshotId: string) => void
}

export function SnapshotPanel({ viewId, onViewSnapshot }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newSnapshotName, setNewSnapshotName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const loadSnapshots = useCallback(async () => {
    try {
      const response = await fetch(`/api/views/${viewId}/snapshots`)
      if (response.ok) {
        const data = await response.json()
        setSnapshots(data.snapshots)
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error)
    } finally {
      setIsLoading(false)
    }
  }, [viewId])

  useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  const createSnapshot = async () => {
    if (isCreating) return

    setIsCreating(true)
    try {
      const response = await fetch(`/api/views/${viewId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSnapshotName || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSnapshots((prev) => [data.snapshot, ...prev])
        setNewSnapshotName('')
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Failed to create snapshot:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const deleteSnapshot = async (snapshotId: string) => {
    if (!confirm('Delete this snapshot?')) return

    try {
      const response = await fetch(`/api/views/${viewId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId))
      }
    } catch (error) {
      console.error('Failed to delete snapshot:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Snapshots
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900"
        >
          + New Snapshot
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            placeholder="Snapshot name (optional)"
            className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
          <div className="flex gap-2">
            <button
              onClick={createSnapshot}
              disabled={isCreating}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Save Snapshot'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Snapshots List */}
      {isLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading snapshots...</div>
      ) : snapshots.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No snapshots yet. Create one to save the current state.
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div>
                <button
                  onClick={() => onViewSnapshot(snapshot.id)}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {snapshot.name}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(snapshot.createdAt)}
                  {snapshot.noteCount !== undefined && ` • ${snapshot.noteCount} notes`}
                </p>
              </div>
              <button
                onClick={() => deleteSnapshot(snapshot.id)}
                className="p-1 text-gray-400 hover:text-red-500"
                title="Delete snapshot"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
