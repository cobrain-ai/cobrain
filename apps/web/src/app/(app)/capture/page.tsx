'use client'

import { useCallback, useState } from 'react'
import { TextInput } from '@/components/capture'

export default function CapturePage() {
  const [recentNotes, setRecentNotes] = useState<string[]>([])

  const handleSave = useCallback(async (content: string) => {
    // TODO: Save to database via API
    console.log('Saving note:', content)

    // For now, just add to local state
    setRecentNotes((prev) => [content, ...prev].slice(0, 5))

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [])

  const handleAutoSave = useCallback((content: string) => {
    // Auto-save draft to localStorage (handled in component)
    console.log('Auto-saving draft:', content.substring(0, 50) + '...')
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Capture Your Thoughts</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Just type naturally. CoBrain will organize everything for you.
        </p>
      </div>

      <TextInput
        onSave={handleSave}
        onAutoSave={handleAutoSave}
        minRows={4}
        maxRows={15}
      />

      {/* Voice Input Button */}
      <div className="mt-4 flex items-center gap-4">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          aria-label="Voice input"
        >
          <span>🎤</span>
          <span className="text-sm">Voice Input</span>
        </button>
        <span className="text-xs text-gray-400">
          Coming soon: Speak your thoughts
        </span>
      </div>

      {/* Quick Tips */}
      <div className="mt-12 p-6 rounded-xl bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold mb-3">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <strong>Time reminders:</strong> &quot;Remind me to call John tomorrow at 2pm&quot;
          </li>
          <li>
            <strong>People:</strong> Names are automatically extracted as entities
          </li>
          <li>
            <strong>Commitments:</strong> &quot;I promised to review the proposal by Friday&quot;
          </li>
          <li>
            <strong>Formatting:</strong> Use **bold**, *italic*, and - bullet lists
          </li>
        </ul>
      </div>

      {/* Recent Notes Preview */}
      {recentNotes.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Recently Captured
          </h2>
          <div className="space-y-2">
            {recentNotes.map((note, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 truncate"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
