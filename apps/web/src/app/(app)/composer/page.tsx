'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { NoteSelector } from '@/components/composer/NoteSelector'
import { PlatformPicker } from '@/components/composer/PlatformPicker'
import { StyleSelector } from '@/components/composer/StyleSelector'
import { ContentEditor } from '@/components/composer/ContentEditor'
import { PublishActions } from '@/components/composer/PublishActions'

type Step = 'select' | 'configure' | 'generate' | 'review'

interface PlatformContent {
  body: string
  title?: string
  format: string
  threadParts?: string[]
  excerpt?: string
}

interface Account {
  id: string
  platform: string
  accountName: string | null
}

export default function ComposerPage() {
  // Step state
  const [step, setStep] = useState<Step>('select')

  // Selection state
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [topic, setTopic] = useState('')

  // Generation state
  const [contents, setContents] = useState<Record<string, PlatformContent>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Publish state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Generate content
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenerateError(null)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/composer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceNoteIds: selectedNoteIds,
          targetPlatforms: selectedPlatforms,
          styleGuideId: selectedStyleId,
          topic: topic || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await res.json()
      setContents(data.contents)
      setStep('generate')

      // Fetch accounts for publish step
      fetchAccounts()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedNoteIds, selectedPlatforms, selectedStyleId, topic])

  // Regenerate for single platform
  const handleRegenerate = useCallback(
    async (platform: string, feedback: string) => {
      setIsRegenerating(platform)

      try {
        const res = await fetch('/api/composer/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceNoteIds: selectedNoteIds,
            targetPlatforms: [platform],
            styleGuideId: selectedStyleId,
            topic: feedback, // Use feedback as topic hint for regeneration
          }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.contents[platform]) {
            setContents((prev) => ({ ...prev, [platform]: data.contents[platform] }))
          }
        }
      } catch {
        // ignore
      } finally {
        setIsRegenerating(null)
      }
    },
    [selectedNoteIds, selectedStyleId]
  )

  // Update content in editor
  const handleContentChange = (platform: string, body: string) => {
    setContents((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], body },
    }))
  }

  // Fetch publishing accounts
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/publishing/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts)
      }
    } catch {
      // ignore
    }
  }

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    setStatusMessage(null)

    try {
      const contentArray = Object.entries(contents).map(([platform, c]) => ({
        platform,
        content: c.body,
        format: c.format,
      }))

      const res = await fetch('/api/composer/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic || 'Untitled draft',
          sourceNoteIds: selectedNoteIds,
          contents: contentArray,
        }),
      })

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Draft saved successfully!' })
      } else {
        throw new Error('Failed to save draft')
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to save draft' })
    } finally {
      setIsSaving(false)
    }
  }, [contents, topic, selectedNoteIds])

  // Publish
  const handlePublish = useCallback(
    async (accountId: string, platform: string, scheduledFor?: string) => {
      setIsPublishing(true)
      setStatusMessage(null)

      try {
        const content = contents[platform]
        if (!content) throw new Error('No content for this platform')

        const res = await fetch('/api/publishing/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            accountId,
            content: content.body,
            scheduledFor,
          }),
        })

        if (res.ok) {
          setStatusMessage({
            type: 'success',
            text: scheduledFor ? 'Post scheduled successfully!' : 'Post queued for publishing!',
          })
        } else {
          throw new Error('Publishing failed')
        }
      } catch {
        setStatusMessage({ type: 'error', text: 'Publishing failed' })
      } finally {
        setIsPublishing(false)
      }
    },
    [contents]
  )

  const canConfigure = selectedNoteIds.length > 0
  const canGenerate = selectedPlatforms.length > 0 && selectedNoteIds.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Composer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generate content from your notes for blogs and social media
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/composer/styles"
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Writing Styles
            </Link>
            <Link
              href="/composer/accounts"
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Accounts
            </Link>
            <Link
              href="/composer/queue"
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['select', 'configure', 'generate', 'review'] as Step[]).map((s, i) => {
          const labels = ['1. Notes', '2. Configure', '3. Generate', '4. Publish']
          const isActive = s === step
          const isPast =
            ['select', 'configure', 'generate', 'review'].indexOf(s) <
            ['select', 'configure', 'generate', 'review'].indexOf(step)
          return (
            <button
              key={s}
              onClick={() => {
                if (isPast || isActive) setStep(s)
              }}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isPast
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}
            >
              {labels[i]}
            </button>
          )
        })}
      </div>

      {/* Status message */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            statusMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Step content */}
      <div className="space-y-6">
        {/* Step 1: Select Notes */}
        {(step === 'select' || step === 'configure') && (
          <section className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <NoteSelector
              selectedNoteIds={selectedNoteIds}
              onSelectionChange={setSelectedNoteIds}
            />
            {canConfigure && step === 'select' && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep('configure')}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Configure
                </button>
              </div>
            )}
          </section>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && (
          <section className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <PlatformPicker
              selectedPlatforms={selectedPlatforms}
              onSelectionChange={setSelectedPlatforms}
            />

            <StyleSelector
              selectedStyleId={selectedStyleId}
              onStyleChange={setSelectedStyleId}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Topic (optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., latest trends in AI, my experience with..."
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {generateError && (
              <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {generateError}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Edit generated content */}
        {step === 'generate' && (
          <section className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <ContentEditor
              contents={contents}
              onContentChange={handleContentChange}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep('configure')}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Back
              </button>
              <button
                onClick={() => setStep('review')}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Publish
              </button>
            </div>
          </section>
        )}

        {/* Step 4: Publish / Save */}
        {step === 'review' && (
          <section className="space-y-4">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <ContentEditor
                contents={contents}
                onContentChange={handleContentChange}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
              />
            </div>

            <PublishActions
              hasContent={Object.keys(contents).length > 0}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              accounts={accounts}
              isSaving={isSaving}
              isPublishing={isPublishing}
            />

            <div className="flex justify-start">
              <button
                onClick={() => setStep('generate')}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Back to Edit
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
