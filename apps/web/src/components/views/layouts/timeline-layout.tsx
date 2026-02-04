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

interface TimelineLayoutProps {
  notes: Note[]
}

// Group notes by date
function groupByDate(notes: Note[]) {
  const groups: Record<string, Note[]> = {}

  notes.forEach((note) => {
    const date = new Date(note.createdAt)
    const key = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(note)
  })

  // Sort by date (most recent first)
  return Object.entries(groups).sort((a, b) => {
    return new Date(b[0]).getTime() - new Date(a[0]).getTime()
  })
}

export function TimelineLayout({ notes }: TimelineLayoutProps) {
  const groupedNotes = groupByDate(notes)

  const getTitle = (content: string) => {
    const lines = content.split('\n').filter(Boolean)
    return lines[0]?.slice(0, 80) || 'Untitled'
  }

  const getBody = (content: string) => {
    const lines = content.split('\n').filter(Boolean)
    return lines.slice(1).join(' ').slice(0, 150)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-8">
        {groupedNotes.map(([date, dateNotes]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10">
                <CalendarIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {date}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {dateNotes.length} note{dateNotes.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Notes for this date */}
            <div className="ml-12 space-y-3">
              {dateNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes?highlight=${note.id}`}
                  className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-400 font-mono mt-1">
                      {formatTime(note.createdAt)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {getTitle(note.content)}
                        </h4>
                        {note.metadata?.isPinned && (
                          <span className="text-yellow-500">
                            <PinIcon className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      {getBody(note.content) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {getBody(note.content)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  )
}
