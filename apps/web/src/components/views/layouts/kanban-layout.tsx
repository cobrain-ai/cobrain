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

interface KanbanLayoutProps {
  notes: Note[]
}

// Group notes into columns based on content keywords or date
function groupNotes(notes: Note[]) {
  const columns: Record<string, Note[]> = {
    'To Do': [],
    'In Progress': [],
    'Done': [],
    'Other': [],
  }

  notes.forEach((note) => {
    const content = note.content.toLowerCase()
    if (content.includes('done') || content.includes('completed') || content.includes('finished')) {
      columns['Done'].push(note)
    } else if (content.includes('progress') || content.includes('working') || content.includes('started')) {
      columns['In Progress'].push(note)
    } else if (content.includes('todo') || content.includes('to do') || content.includes('need to')) {
      columns['To Do'].push(note)
    } else {
      columns['Other'].push(note)
    }
  })

  // Filter out empty columns except for the main three
  return Object.entries(columns).filter(
    ([key, items]) => items.length > 0 || ['To Do', 'In Progress', 'Done'].includes(key)
  )
}

export function KanbanLayout({ notes }: KanbanLayoutProps) {
  const columns = groupNotes(notes)

  const getTitle = (content: string) => {
    const lines = content.split('\n').filter(Boolean)
    return lines[0]?.slice(0, 60) || 'Untitled'
  }

  const columnColors: Record<string, string> = {
    'To Do': 'border-t-blue-500',
    'In Progress': 'border-t-yellow-500',
    'Done': 'border-t-green-500',
    'Other': 'border-t-gray-400',
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(([columnName, columnNotes]) => (
        <div
          key={columnName}
          className={`flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800/50 rounded-xl overflow-hidden border-t-4 ${columnColors[columnName] || columnColors['Other']}`}
        >
          {/* Column Header */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {columnName}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {columnNotes.length}
              </span>
            </div>
          </div>

          {/* Column Content */}
          <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
            {columnNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No items
              </div>
            ) : (
              columnNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes?highlight=${note.id}`}
                  className="block p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-shadow"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    {getTitle(note.content)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {note.metadata?.isPinned && (
                      <span className="text-yellow-500">
                        <PinIcon className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
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
