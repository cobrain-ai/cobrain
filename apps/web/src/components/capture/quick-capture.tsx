'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface QuickCaptureProps {
  onSave?: (content: string) => Promise<void>
}

export function QuickCapture({ onSave }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard shortcut (Ctrl/Cmd + Shift + C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (isOpen && !content.trim()) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, content])

  const handleSave = useCallback(async () => {
    if (!content.trim() || isSaving) return

    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(content)
      } else {
        // Default: save via API
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, source: 'text' }),
        })

        if (!response.ok) {
          throw new Error('Failed to save')
        }
      }

      setContent('')
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsOpen(false)
      }, 1500)
    } catch (error) {
      console.error('Quick capture save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [content, isSaving, onSave])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Quick capture popup */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          style={{
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {showSuccess ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-green-600 font-medium">Note saved!</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <span className="font-medium">Quick Capture</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind?"
                  className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                />

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">
                      {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
                    </kbd>
                    +
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">
                      Enter
                    </kbd>
                  </span>

                  <button
                    onClick={handleSave}
                    disabled={!content.trim() || isSaving}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-200
          ${
            isOpen
              ? 'bg-gray-200 dark:bg-gray-800 rotate-45'
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
          }
        `}
        aria-label={isOpen ? 'Close quick capture' : 'Open quick capture'}
        title={`Quick Capture (${typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+C)`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isOpen ? 'currentColor' : 'white'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
