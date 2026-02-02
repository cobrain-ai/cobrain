'use client'

import { useState } from 'react'

interface Note {
  id: string
  content: string
  createdAt: Date
  isPinned: boolean
}

// Mock data for UI development
const mockNotes: Note[] = [
  {
    id: '1',
    content: 'Remember to review the quarterly report with Sarah on Monday',
    createdAt: new Date('2026-02-03T10:00:00'),
    isPinned: true,
  },
  {
    id: '2',
    content: 'Ideas for the new product launch:\n- Focus on AI features\n- Target early adopters\n- Partner with tech influencers',
    createdAt: new Date('2026-02-02T15:30:00'),
    isPinned: false,
  },
  {
    id: '3',
    content: 'Meeting notes from the team standup:\n- Backend API is ready\n- Frontend needs 2 more days\n- Launch planned for Friday',
    createdAt: new Date('2026-02-01T09:00:00'),
    isPinned: false,
  },
]

export default function NotesPage() {
  const [notes] = useState<Note[]>(mockNotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'pinned'>('all')

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || note.isPinned
    return matchesSearch && matchesFilter
  })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Notes</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{filteredNotes.length} notes</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pinned')}
            aria-pressed={filter === 'pinned'}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pinned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Pinned
          </button>
        </div>
      </div>

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'No notes match your search' : 'No notes yet'}
          </p>
          <a
            href="/capture"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            ✨ Create your first note
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                    {note.content}
                  </p>
                </div>
                {note.isPinned && (
                  <span className="flex-shrink-0" title="Pinned">
                    📌
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{formatDate(note.createdAt)}</span>
                <button
                  className="hover:text-blue-600 transition-colors"
                  aria-label="Edit note"
                >
                  Edit
                </button>
                <button
                  className="hover:text-red-600 transition-colors"
                  aria-label="Delete note"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
