'use client'

const PLATFORMS = [
  { id: 'threads', label: 'Threads', icon: '🧵', category: 'social' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦', category: 'social' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', category: 'social' },
  { id: 'mastodon', label: 'Mastodon', icon: '🐘', category: 'social' },
  { id: 'bluesky', label: 'Bluesky', icon: '🦋', category: 'social' },
  { id: 'hashnode', label: 'Hashnode', icon: '📝', category: 'blog' },
  { id: 'devto', label: 'Dev.to', icon: '👩‍💻', category: 'blog' },
  { id: 'medium', label: 'Medium', icon: '📰', category: 'blog' },
  { id: 'wordpress', label: 'WordPress', icon: '🌐', category: 'blog' },
  { id: 'ghost', label: 'Ghost', icon: '👻', category: 'blog' },
] as const

interface PlatformPickerProps {
  selectedPlatforms: string[]
  onSelectionChange: (platforms: string[]) => void
}

export function PlatformPicker({ selectedPlatforms, onSelectionChange }: PlatformPickerProps) {
  const toggle = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      onSelectionChange(selectedPlatforms.filter((p) => p !== id))
    } else {
      onSelectionChange([...selectedPlatforms, id])
    }
  }

  const socialPlatforms = PLATFORMS.filter((p) => p.category === 'social')
  const blogPlatforms = PLATFORMS.filter((p) => p.category === 'blog')

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Target Platforms
      </label>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Social</p>
          <div className="flex flex-wrap gap-2">
            {socialPlatforms.map((p) => (
              <PlatformChip
                key={p.id}
                platform={p}
                isSelected={selectedPlatforms.includes(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Blog</p>
          <div className="flex flex-wrap gap-2">
            {blogPlatforms.map((p) => (
              <PlatformChip
                key={p.id}
                platform={p}
                isSelected={selectedPlatforms.includes(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlatformChip({
  platform,
  isSelected,
  onToggle,
}: {
  platform: { id: string; label: string; icon: string }
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      <span>{platform.icon}</span>
      <span>{platform.label}</span>
    </button>
  )
}
