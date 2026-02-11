'use client'

import { useState } from 'react'
import { PlatformTab } from './PlatformTab'

interface PlatformContent {
  body: string
  title?: string
  format: string
  threadParts?: string[]
  excerpt?: string
}

interface ContentEditorProps {
  contents: Record<string, PlatformContent>
  onContentChange: (platform: string, content: string) => void
  onRegenerate: (platform: string, feedback: string) => void
  isRegenerating: string | null
}

const PLATFORM_LABELS: Record<string, { label: string; icon: string }> = {
  threads: { label: 'Threads', icon: '🧵' },
  twitter: { label: 'Twitter/X', icon: '🐦' },
  linkedin: { label: 'LinkedIn', icon: '💼' },
  mastodon: { label: 'Mastodon', icon: '🐘' },
  bluesky: { label: 'Bluesky', icon: '🦋' },
  hashnode: { label: 'Hashnode', icon: '📝' },
  devto: { label: 'Dev.to', icon: '👩‍💻' },
  medium: { label: 'Medium', icon: '📰' },
  wordpress: { label: 'WordPress', icon: '🌐' },
  ghost: { label: 'Ghost', icon: '👻' },
}

export function ContentEditor({
  contents,
  onContentChange,
  onRegenerate,
  isRegenerating,
}: ContentEditorProps) {
  const platforms = Object.keys(contents)
  const [activeTab, setActiveTab] = useState(platforms[0] || '')

  if (platforms.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Generated Content
      </label>

      {/* Platform tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {platforms.map((platform) => {
          const info = PLATFORM_LABELS[platform] || { label: platform, icon: '📄' }
          const isActive = activeTab === platform
          return (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active tab content */}
      {activeTab && contents[activeTab] && (
        <PlatformTab
          platform={activeTab}
          content={contents[activeTab]}
          onChange={(body) => onContentChange(activeTab, body)}
          onRegenerate={(feedback) => onRegenerate(activeTab, feedback)}
          isRegenerating={isRegenerating === activeTab}
        />
      )}
    </div>
  )
}
