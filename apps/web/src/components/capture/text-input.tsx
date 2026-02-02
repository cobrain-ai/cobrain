'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export interface TextInputProps {
  initialValue?: string
  placeholder?: string
  onSave?: (content: string) => void | Promise<void>
  onAutoSave?: (content: string) => void
  autoSaveDelay?: number
  minRows?: number
  maxRows?: number
  disabled?: boolean
  className?: string
}

export function TextInput({
  initialValue = '',
  placeholder = "What's on your mind? Just type naturally...",
  onSave,
  onAutoSave,
  autoSaveDelay = 300,
  minRows = 3,
  maxRows = 20,
  disabled = false,
  className = '',
}: TextInputProps) {
  const [content, setContent] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const scrollHeight = textarea.scrollHeight
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
    const minHeight = lineHeight * minRows
    const maxHeight = lineHeight * maxRows

    textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
  }, [content, minRows, maxRows])

  // Auto-save with debounce
  useEffect(() => {
    if (!onAutoSave || !content.trim()) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      onAutoSave(content)
      setLastSaved(new Date())
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, onAutoSave, autoSaveDelay])

  // LocalStorage fallback for offline
  useEffect(() => {
    if (content.trim()) {
      localStorage.setItem('cobrain-draft', content)
    }
  }, [content])

  // Restore draft on mount
  useEffect(() => {
    if (!initialValue) {
      const draft = localStorage.getItem('cobrain-draft')
      if (draft) {
        setContent(draft)
      }
    }
  }, [initialValue])

  const handleSave = useCallback(async () => {
    if (!content.trim() || !onSave || isSaving) return

    setIsSaving(true)
    try {
      await onSave(content)
      setContent('')
      localStorage.removeItem('cobrain-draft')
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save note:', error)
    } finally {
      setIsSaving(false)
    }
  }, [content, onSave, isSaving])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave]
  )

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items

    for (const item of items) {
      // Handle image paste
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        // TODO: Implement image upload
        console.log('Image paste detected - upload not yet implemented')
        return
      }

      // Handle URL paste - could extract metadata
      if (item.type === 'text/plain') {
        const text = e.clipboardData.getData('text/plain')
        if (text.match(/^https?:\/\//)) {
          // TODO: Extract URL metadata
          console.log('URL pasted:', text)
        }
      }
    }
  }, [])

  const formatLastSaved = () => {
    if (!lastSaved) return null
    const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
    if (seconds < 5) return 'Saved'
    if (seconds < 60) return `Saved ${seconds}s ago`
    return `Saved ${Math.floor(seconds / 60)}m ago`
  }

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full p-4 rounded-xl
          border-2 transition-all duration-200
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          resize-none overflow-hidden
          focus:outline-none
          ${
            isFocused
              ? 'border-blue-500 shadow-lg shadow-blue-500/10'
              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label="Note content"
      />

      {/* Footer with status and actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {lastSaved && <span>{formatLastSaved()}</span>}
          {content.trim() && (
            <span>
              {content.trim().split(/\s+/).length} words
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">
              {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">
              Enter
            </kbd>
            {' to save'}
          </span>

          <button
            onClick={handleSave}
            disabled={!content.trim() || isSaving || disabled}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                content.trim() && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Markdown hint */}
      {isFocused && content.trim() && (
        <div className="absolute -bottom-8 left-0 text-xs text-gray-400">
          Supports **bold**, *italic*, - lists, and [links](url)
        </div>
      )}
    </div>
  )
}
