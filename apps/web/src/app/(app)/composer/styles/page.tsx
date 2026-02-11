'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StyleFormModal, type StyleFormData } from '@/components/composer/StyleFormModal'

interface StyleGuide {
  id: string
  name: string
  isDefault: boolean
  tone: string
  language: string
  targetAudience: string | null
  customToneDescription: string | null
  samplePost: string | null
  rules: Array<{ type: string; description: string }>
  serviceOverrides: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export default function StylesPage() {
  const [styles, setStyles] = useState<StyleGuide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStyle, setEditingStyle] = useState<StyleGuide | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchStyles = useCallback(async () => {
    try {
      const res = await fetch('/api/styles')
      if (res.ok) {
        const data = await res.json()
        setStyles(data.styles)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStyles()
  }, [fetchStyles])

  const handleCreate = async (data: StyleFormData) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setIsModalOpen(false)
        fetchStyles()
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (data: StyleFormData) => {
    if (!editingStyle) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/styles/${editingStyle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setEditingStyle(null)
        fetchStyles()
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this style guide?')) return
    try {
      const res = await fetch(`/api/styles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchStyles()
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/composer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; Composer
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Writing Styles
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Define writing style guides for AI content generation
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Style
          </button>
        </div>
      </div>

      {/* Style list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading styles...</div>
      ) : styles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-xl mb-2">📝</p>
          <p className="text-gray-600 dark:text-gray-400 mb-3">No writing styles yet</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create your first style guide
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {styles.map((style) => (
            <div
              key={style.id}
              className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {style.name}
                    </h3>
                    {style.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Tone: {style.tone}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Language: {style.language}
                    </span>
                    {style.targetAudience && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Audience: {style.targetAudience}
                      </span>
                    )}
                    {style.rules.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {style.rules.length} rule(s)
                      </span>
                    )}
                  </div>
                  {style.samplePost && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2 italic">
                      &ldquo;{style.samplePost}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingStyle(style)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(style.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <StyleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreate}
        isSaving={isSaving}
        title="Create Writing Style"
      />

      {/* Edit modal */}
      {editingStyle && (
        <StyleFormModal
          isOpen={true}
          onClose={() => setEditingStyle(null)}
          onSave={handleUpdate}
          isSaving={isSaving}
          title="Edit Writing Style"
          initialData={{
            name: editingStyle.name,
            isDefault: editingStyle.isDefault,
            tone: editingStyle.tone,
            language: editingStyle.language,
            targetAudience: editingStyle.targetAudience ?? '',
            customToneDescription: editingStyle.customToneDescription ?? '',
            samplePost: editingStyle.samplePost ?? '',
            rules: editingStyle.rules,
          }}
        />
      )}
    </div>
  )
}
