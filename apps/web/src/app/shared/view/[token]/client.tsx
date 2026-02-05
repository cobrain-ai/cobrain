'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, AlertCircle } from 'lucide-react'

interface SharedViewClientProps {
  token: string
  requiresPassword?: boolean
  passwordError?: boolean
  viewName?: string
}

export function SharedViewClient({
  token,
  requiresPassword,
  passwordError,
  viewName,
}: SharedViewClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Navigate with password as query param
    router.push(`/shared/view/${token}?password=${encodeURIComponent(password)}`)
  }

  if (!requiresPassword) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-800">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Password Protected
            </h1>
            {viewName && (
              <p className="mt-1 text-sm text-gray-500">
                &quot;{viewName}&quot; requires a password to view
              </p>
            )}
          </div>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Incorrect password. Please try again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Enter Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the share password"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full mt-4 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Verifying...' : 'View Content'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            This view is protected. Contact the owner for the password.
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Powered by <strong>CoBrain</strong>
        </p>
      </div>
    </div>
  )
}
