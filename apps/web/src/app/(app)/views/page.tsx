'use client'

import { useState, useEffect } from 'react'
import { TemplatePicker } from '@/components/views/template-picker'
import { ViewCard } from '@/components/views/view-card'

interface View {
  id: string
  name: string
  description: string | null
  type: string
  layout: string
  isPinned: boolean
  updatedAt: string
}

interface Template {
  type: string
  name: string
  description: string
  layout: string
}

export default function ViewsPage() {
  const [views, setViews] = useState<View[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showCreateCustom, setShowCreateCustom] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  useEffect(() => {
    fetchViews()
    fetchTemplates()
  }, [])

  const fetchViews = async () => {
    try {
      const response = await fetch('/api/views')
      if (response.ok) {
        const data = await response.json()
        setViews(data.views || [])
      }
    } catch (error) {
      console.error('Failed to fetch views:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/views?action=templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const createFromTemplate = async (templateType: string) => {
    try {
      const response = await fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fromTemplate', templateType }),
      })
      if (response.ok) {
        const data = await response.json()
        setViews((prev) => [data.view, ...prev])
        setShowTemplatePicker(false)
      }
    } catch (error) {
      console.error('Failed to create view:', error)
    }
  }

  const createCustomView = async () => {
    if (!newViewName.trim()) return

    try {
      const response = await fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newViewName }),
      })
      if (response.ok) {
        const data = await response.json()
        setViews((prev) => [data.view, ...prev])
        setShowCreateCustom(false)
        setNewViewName('')
      }
    } catch (error) {
      console.error('Failed to create view:', error)
    }
  }

  const deleteView = async (id: string) => {
    try {
      const response = await fetch(`/api/views?id=${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setViews((prev) => prev.filter((v) => v.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete view:', error)
    }
  }

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/views?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      })
      if (response.ok) {
        setViews((prev) =>
          prev.map((v) => (v.id === id ? { ...v, isPinned: !isPinned } : v))
        )
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Views
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize your notes with dynamic, auto-updating views
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            + From Template
          </button>
          <button
            onClick={() => setShowCreateCustom(true)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
          >
            + Custom View
          </button>
        </div>
      </div>

      {/* Views Grid */}
      {views.length === 0 ? (
        <div className="text-center py-16">
          <ViewsIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No views yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first view to organize your notes
          </p>
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Get Started with Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {views.map((view) => (
            <ViewCard
              key={view.id}
              view={view}
              onDelete={() => deleteView(view.id)}
              onTogglePin={() => togglePin(view.id, view.isPinned)}
            />
          ))}
        </div>
      )}

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <TemplatePicker
          templates={templates}
          onSelect={createFromTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {/* Create Custom Modal */}
      {showCreateCustom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create Custom View
            </h2>
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreateCustom(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createCustomView}
                disabled={!newViewName.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  )
}
