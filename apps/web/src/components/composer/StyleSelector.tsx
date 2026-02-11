'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StyleGuide {
  id: string
  name: string
  tone: string
  language: string
  isDefault: boolean
}

interface StyleSelectorProps {
  selectedStyleId: string | null
  onStyleChange: (id: string | null) => void
}

export function StyleSelector({ selectedStyleId, onStyleChange }: StyleSelectorProps) {
  const [styles, setStyles] = useState<StyleGuide[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStyles() {
      try {
        const res = await fetch('/api/styles')
        if (res.ok) {
          const data = await res.json()
          setStyles(data.styles)

          // Auto-select default style
          if (!selectedStyleId) {
            const defaultStyle = data.styles.find((s: StyleGuide) => s.isDefault)
            if (defaultStyle) {
              onStyleChange(defaultStyle.id)
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchStyles()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Writing Style
        </label>
        <Link
          href="/composer/styles"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Manage styles
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading styles...</div>
      ) : (
        <select
          value={selectedStyleId ?? ''}
          onChange={(e) => onStyleChange(e.target.value || null)}
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No style (use defaults)</option>
          {styles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name} ({style.tone}, {style.language})
              {style.isDefault ? ' — Default' : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
