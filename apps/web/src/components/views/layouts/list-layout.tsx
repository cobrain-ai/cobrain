'use client'

import Link from 'next/link'

interface Note {
  id: string
  content: string
  createdAt: string
  metadata?: {
    isPinned?: boolean
    isArchived?: boolean
  }
}

interface ListLayoutProps {
  notes: Note[]
}

export function ListLayout({ notes }: ListLayoutProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(Boolean)
    return lines[0]?.slice(0, 100) || 'Empty note'
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/notes?highlight=${note.id}`}
          className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                {getPreview(note.content)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {note.content.length > 100 ? note.content.slice(0, 200) + '...' : note.content}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {note.metadata?.isPinned && (
                <span className="text-yellow-500">
                  <PinIcon className="w-4 h-4" />
                </span>
              )}
              <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  )
}
