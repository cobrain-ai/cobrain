'use client'

import { useState, useEffect, useCallback } from 'react'

interface Note {
  id: string
  content: string
  createdAt: string
}

interface NoteSelectorProps {
  selectedNoteIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function NoteSelector({ selectedNoteIds, onSelectionChange }: NoteSelectorProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/notes?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300)
    return () => clearTimeout(timer)
  }, [fetchNotes])

  const toggleNote = (id: string) => {
    if (selectedNoteIds.includes(id)) {
      onSelectionChange(selectedNoteIds.filter((n) => n !== id))
    } else {
      onSelectionChange([...selectedNoteIds, id])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Source Notes
        </label>
        {selectedNoteIds.length > 0 && (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {selectedNoteIds.length} selected
          </span>
        )}
      </div>

      {/* Selected notes pills */}
      {selectedNoteIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNoteIds.map((id) => {
            const note = notes.find((n) => n.id === id)
            return (
              <button
                key={id}
                onClick={() => toggleNote(id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900"
              >
                <span className="max-w-[150px] truncate">
                  {note?.content.substring(0, 40) || id.substring(0, 8)}
                </span>
                <span className="text-blue-500">&times;</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes..."
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Notes list */}
      <div className="max-h-60 overflow-y-auto border rounded-lg border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No notes found</div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNoteIds.includes(note.id)
            return (
              <button
                key={note.id}
                onClick={() => toggleNote(note.id)}
                className={`w-full text-left px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
