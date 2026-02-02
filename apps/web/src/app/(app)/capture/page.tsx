'use client'

import { useState } from 'react'

export default function CapturePage() {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    // TODO: Save note
    console.log('Saving note:', content)
    setContent('')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Capture Your Thoughts</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Just type naturally..."
            className="w-full h-40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            autoFocus
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              aria-label="Voice input"
            >
              🎤
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-xs">Enter</kbd> to save
          </p>
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
          >
            Save Note
          </button>
        </div>
      </form>

      {/* Quick Tips */}
      <div className="mt-12 p-6 rounded-xl bg-gray-100 dark:bg-gray-900">
        <h2 className="font-semibold mb-3">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• <strong>Time reminders:</strong> "Remind me to call John tomorrow at 2pm"</li>
          <li>• <strong>People:</strong> Names are automatically extracted as entities</li>
          <li>• <strong>Commitments:</strong> "I promised to review the proposal by Friday"</li>
          <li>• <strong>Projects:</strong> Reference projects naturally in your notes</li>
        </ul>
      </div>
    </div>
  )
}
