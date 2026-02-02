'use client'

import { useTheme } from '@/contexts/theme-context'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                      theme === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t === 'system' ? 'System' : t === 'dark' ? 'Dark' : 'Light'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Settings */}
        <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4">AI Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">AI Provider</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ollama">Ollama (Local)</option>
                <option value="openai" disabled>OpenAI (Pro)</option>
                <option value="anthropic" disabled>Anthropic (Pro)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Using local AI for privacy. Pro features coming soon.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <select className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="llama3:8b">Llama 3 8B</option>
                <option value="llama3:70b">Llama 3 70B</option>
                <option value="mistral">Mistral</option>
              </select>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4">Data & Privacy</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-gray-500">Download all your notes as JSON</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Export
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Delete All Data</p>
                <p className="text-sm text-gray-500">Permanently delete all notes and settings</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold mb-4">About CoBrain</h2>

          <div className="space-y-2 text-sm">
            <p><strong>Version:</strong> 0.1.0 (MVP)</p>
            <p><strong>License:</strong> AGPL-3.0</p>
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

          <p className="mt-4 text-sm text-gray-500">
            Built with ❤️ by the CoBrain community
          </p>
        </section>
      </div>
    </div>
  )
}
