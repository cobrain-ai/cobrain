'use client'

import { useCallback, useState } from 'react'
import { TextInput, VoiceInput, ImageOCR } from '@/components/capture'

interface SavedNote {
  id: string
  content: string
  source: 'text' | 'voice' | 'ocr'
}

export default function CapturePage() {
  const [recentNotes, setRecentNotes] = useState<SavedNote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pendingContent, setPendingContent] = useState<string | null>(null)

  const handleSave = useCallback(async (content: string, source: 'text' | 'voice' | 'ocr' = 'text') => {
    setError(null)

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, source }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save note')
      }

      const { note } = await response.json()
      setRecentNotes((prev) => [{ id: note.id, content, source }, ...prev].slice(0, 5))
      setPendingContent(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }, [])

  const handleTextSave = useCallback(async (content: string) => {
    return handleSave(content, 'text')
  }, [handleSave])

  const handleVoiceTranscript = useCallback((transcript: string) => {
    // Set the transcript as pending, user can edit before saving
    setPendingContent(transcript)
  }, [])

  const handlePendingSave = useCallback(async () => {
    if (pendingContent) {
      await handleSave(pendingContent, 'text')
    }
  }, [pendingContent, handleSave])

  const handleVoiceError = useCallback((errorMsg: string) => {
    setError(errorMsg)
  }, [])

  const handleOCRText = useCallback((text: string) => {
    // Set OCR text as pending, user can edit before saving
    setPendingContent(text)
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Capture Your Thoughts</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Just type naturally. CoBrain will organize everything for you.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <TextInput
        initialValue={pendingContent ?? ''}
        onSave={handleTextSave}
        minRows={4}
        maxRows={15}
      />

      {/* Voice and Image Input */}
      <div className="mt-4 flex gap-4 items-start">
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          onError={handleVoiceError}
        />
        <span className="text-gray-400 dark:text-gray-600 self-center">or</span>
      </div>

      {/* Image OCR */}
      <div className="mt-4">
        <ImageOCR onTextExtracted={handleOCRText} />
      </div>

      {/* Transcript/OCR preview with save option */}
      {pendingContent && (
        <div className="mt-4 p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Text ready to save:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingContent(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Discard
              </button>
              <button
                onClick={handlePendingSave}
                className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {pendingContent}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            You can also edit the transcript in the text input above before saving.
          </p>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-12 p-6 rounded-xl bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold mb-3">Quick Tips</h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <strong>Time reminders:</strong> &quot;Remind me to call John tomorrow at 2pm&quot;
          </li>
          <li>
            <strong>People:</strong> Names are automatically extracted as entities
          </li>
          <li>
            <strong>Commitments:</strong> &quot;I promised to review the proposal by Friday&quot;
          </li>
          <li>
            <strong>Formatting:</strong> Use **bold**, *italic*, and - bullet lists
          </li>
        </ul>
      </div>

      {/* Recent Notes Preview */}
      {recentNotes.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Recently Captured
          </h2>
          <div className="space-y-2">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {note.source === 'voice' ? '🎤 Voice' : note.source === 'ocr' ? '📷 Image' : '⌨️ Text'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
