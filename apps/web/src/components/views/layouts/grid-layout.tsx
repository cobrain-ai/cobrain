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

interface GridLayoutProps {
  notes: Note[]
}

export function GridLayout({ notes }: GridLayoutProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getTitle = (content: string) => {
    const lines = content.split('\n').filter(Boolean)
    return lines[0]?.slice(0, 50) || 'Untitled'
  }

  const getBody = (content: string) => {
    const lines = content.split('\n').filter(Boolean)
    return lines.slice(1).join(' ').slice(0, 150)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {notes.map((note) => (
        <Link
          key={note.id}
          href={`/notes?highlight=${note.id}`}
          className="block p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all h-40 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
              {getTitle(note.content)}
            </h3>
            {note.metadata?.isPinned && (
              <span className="text-yellow-500 ml-2">
                <PinIcon className="w-4 h-4" />
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-4">
            {getBody(note.content) || 'No additional content'}
          </p>
          <div className="mt-auto pt-2">
            <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
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
