'use client'

import { useState, useEffect } from 'react'

const TONES = [
  'professional',
  'casual',
  'academic',
  'humorous',
  'inspirational',
  'conversational',
  'authoritative',
  'custom',
] as const

interface StyleRule {
  type: string
  description: string
}

export interface StyleFormData {
  name: string
  isDefault: boolean
  tone: string
  language: string
  targetAudience: string
  customToneDescription: string
  samplePost: string
  rules: StyleRule[]
}

interface StyleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: StyleFormData) => void
  isSaving: boolean
  initialData?: Partial<StyleFormData>
  title?: string
}

export function StyleFormModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  initialData,
  title = 'Create Writing Style',
}: StyleFormModalProps) {
  const [form, setForm] = useState<StyleFormData>({
    name: '',
    isDefault: false,
    tone: 'professional',
    language: 'en',
    targetAudience: '',
    customToneDescription: '',
    samplePost: '',
    rules: [],
  })

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const updateField = <K extends keyof StyleFormData>(key: K, value: StyleFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addRule = () => {
    setForm((prev) => ({
      ...prev,
      rules: [...prev.rules, { type: 'include', description: '' }],
    }))
  }

  const updateRule = (index: number, field: keyof StyleRule, value: string) => {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }))
  }

  const removeRule = (index: number) => {
    setForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Technical Blog Style"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Default toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateField('isDefault', !form.isDefault)}
              className={`w-10 h-6 rounded-full transition-colors ${
                form.isDefault ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${
                  form.isDefault ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Set as default</span>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tone
            </label>
            <select
              value={form.tone}
              onChange={(e) => updateField('tone', e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Custom tone description */}
          {form.tone === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Tone Description
              </label>
              <textarea
                value={form.customToneDescription}
                onChange={(e) => updateField('customToneDescription', e.target.value)}
                rows={2}
                placeholder="Describe your desired tone..."
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 resize-y"
              />
            </div>
          )}

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language
            </label>
            <input
              type="text"
              value={form.language}
              onChange={(e) => updateField('language', e.target.value)}
              placeholder="en"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Target audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={(e) => updateField('targetAudience', e.target.value)}
              placeholder="e.g., software developers, startup founders"
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Sample post */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sample Post
            </label>
            <textarea
              value={form.samplePost}
              onChange={(e) => updateField('samplePost', e.target.value)}
              rows={3}
              placeholder="Paste a sample post that represents your writing style..."
              className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 resize-y"
            />
          </div>

          {/* Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Style Rules
              </label>
              <button
                onClick={addRule}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add rule
              </button>
            </div>
            {form.rules.map((rule, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={rule.type}
                  onChange={(e) => updateRule(i, 'type', e.target.value)}
                  className="px-2 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  <option value="include">Include</option>
                  <option value="exclude">Exclude</option>
                  <option value="prefer">Prefer</option>
                  <option value="avoid">Avoid</option>
                </select>
                <input
                  type="text"
                  value={rule.description}
                  onChange={(e) => updateRule(i, 'description', e.target.value)}
                  placeholder="Rule description..."
                  className="flex-1 px-2 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                />
                <button
                  onClick={() => removeRule(i)}
                  className="text-red-500 hover:text-red-700 text-xs px-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || isSaving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
