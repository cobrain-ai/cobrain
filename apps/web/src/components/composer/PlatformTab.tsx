'use client'

import { useState } from 'react'

interface PlatformContent {
  body: string
  title?: string
  format: string
  threadParts?: string[]
  excerpt?: string
}

interface PlatformTabProps {
  platform: string
  content: PlatformContent
  onChange: (body: string) => void
  onRegenerate: (feedback: string) => void
  isRegenerating: boolean
}

export function PlatformTab({
  platform,
  content,
  onChange,
  onRegenerate,
  isRegenerating,
}: PlatformTabProps) {
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const isSocial = ['threads', 'twitter', 'mastodon', 'bluesky', 'linkedin'].includes(platform)
  const charCount = content.body.length

  const handleRegenerate = () => {
    if (!feedback.trim()) return
    onRegenerate(feedback)
    setFeedback('')
    setShowFeedback(false)
  }

  return (
    <div className="space-y-3">
      {/* Title for blog platforms */}
      {content.title && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Title</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{content.title}</p>
        </div>
      )}

      {/* Thread parts preview for social */}
      {content.threadParts && content.threadParts.length > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Thread: {content.threadParts.length} parts
        </div>
      )}

      {/* Content editor */}
      <div>
        <textarea
          value={content.body}
          onChange={(e) => onChange(e.target.value)}
          rows={isSocial ? 6 : 15}
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">{charCount} characters</span>
          <span className="text-xs text-gray-400">{content.format}</span>
        </div>
      </div>

      {/* Excerpt for blogs */}
      {content.excerpt && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Excerpt</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">{content.excerpt}</p>
        </div>
      )}

      {/* Regenerate */}
      <div className="flex items-center gap-2">
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            disabled={isRegenerating}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate with feedback'}
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., make it more casual, add hashtags..."
              className="flex-1 px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
              autoFocus
            />
            <button
              onClick={handleRegenerate}
              disabled={!feedback.trim() || isRegenerating}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Go
            </button>
            <button
              onClick={() => {
                setShowFeedback(false)
                setFeedback('')
              }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
