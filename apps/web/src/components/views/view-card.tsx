'use client'

import Link from 'next/link'
import { useState } from 'react'

interface ViewCardProps {
  view: {
    id: string
    name: string
    description: string | null
    type: string
    layout: string
    isPinned: boolean
    updatedAt: string
  }
  onDelete: () => void
  onTogglePin: () => void
}

const layoutIcons: Record<string, React.ReactNode> = {
  list: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  grid: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  kanban: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  timeline: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  graph: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
}

const typeColors: Record<string, string> = {
  projects: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  tasks: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  people: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  timeline: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  recent: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  pinned: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

export function ViewCard({ view, onDelete, onTogglePin }: ViewCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors overflow-hidden group">
      <Link href={`/views/${view.id}`} className="block p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[view.type] || typeColors.custom}`}>
              {view.type}
            </span>
            {view.isPinned && (
              <span className="text-yellow-500">
                <PinIcon className="w-4 h-4" />
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-gray-400">
            {layoutIcons[view.layout] || layoutIcons.list}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {view.name}
        </h3>
        {view.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {view.description}
          </p>
        )}

        <div className="mt-4 text-xs text-gray-400">
          Updated {formatDate(view.updatedAt)}
        </div>
      </Link>

      {/* Actions Menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.preventDefault()
            setShowMenu(!showMenu)
          }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        >
          <MoreIcon className="w-4 h-4 text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onTogglePin()
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <PinIcon className="w-4 h-4" />
                {view.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (confirm('Delete this view?')) {
                    onDelete()
                  }
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM10 18a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  )
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
