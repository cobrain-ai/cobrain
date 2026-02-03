'use client'

import { SETUP_GUIDES } from '@/lib/providers'
import type { ProviderStatus } from '@/lib/providers'

export interface AppearanceSectionProps {
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

export function AppearanceSection({ theme, onThemeChange }: AppearanceSectionProps): React.ReactElement {
  const themes = ['light', 'dark', 'system'] as const
  const themeLabels = { light: 'Light', dark: 'Dark', system: 'System' }

  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">&#127912;</span>
        Appearance
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => onThemeChange(t)}
                aria-pressed={theme === t}
                className={`
                  flex-1 px-4 py-2 rounded-lg capitalize transition-all font-medium
                  ${theme === t
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {themeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export interface DataPrivacySectionProps {
  onExport?: () => void
  onDelete?: () => void
}

export function DataPrivacySection({ onExport, onDelete }: DataPrivacySectionProps): React.ReactElement {
  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">&#128274;</span>
        Data &amp; Privacy
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Export Data</p>
            <p className="text-sm text-gray-500">Download all your notes as JSON</p>
          </div>
          <button
            onClick={onExport}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
          >
            Export
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-600">Delete All Data</p>
            <p className="text-sm text-gray-500">Permanently delete all notes and settings</p>
          </div>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </section>
  )
}

export interface QuickStatsSectionProps {
  providers: ProviderStatus[]
}

export function QuickStatsSection({ providers }: QuickStatsSectionProps): React.ReactElement {
  const connectedCount = providers.filter((p) => p.status === 'connected').length
  const providersWithLatency = providers.filter((p) => p.latency !== undefined)
  const avgLatency = providersWithLatency.length > 0
    ? Math.round(
        providersWithLatency.reduce((acc, p) => acc + (p.latency ?? 0), 0) / providersWithLatency.length
      )
    : 0

  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">&#128202;</span>
        Quick Stats
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active Providers</span>
          <span className="font-mono font-bold text-lg">
            {connectedCount}/{providers.length}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Avg Latency</span>
          <span className="font-mono font-bold text-lg">{avgLatency}ms</span>
        </div>
      </div>
    </section>
  )
}

export function SetupGuidesSection(): React.ReactElement {
  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">&#128214;</span>
        Setup Guides
      </h3>
      <div className="space-y-2">
        {SETUP_GUIDES.map((guide) => (
          <a
            key={guide.href}
            href={guide.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <p className="text-sm font-medium">{guide.title}</p>
            <p className="text-xs text-gray-500">{guide.description}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

export function AboutSection(): React.ReactElement {
  return (
    <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="text-xl">&#8505;&#65039;</span>
        About CoBrain
      </h3>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Version:</strong> 0.1.0 (MVP)
        </p>
        <p>
          <strong>License:</strong> AGPL-3.0
        </p>
        <p>
          <strong>GitHub:</strong>{' '}
          <a
            href="https://github.com/cobrain-ai/cobrain"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            cobrain-ai/cobrain
          </a>
        </p>
      </div>

      <p className="mt-4 text-sm text-gray-500">Built with love by the CoBrain community</p>
    </section>
  )
}
