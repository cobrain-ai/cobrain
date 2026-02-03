'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface VoiceInputProps {
  onTranscript: (transcript: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

// Browser speech recognition types
type SpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

export function VoiceInput({
  onTranscript,
  onError,
  disabled = false,
  className = '',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (disabled || !isSupported) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      onError?.('Speech recognition not supported in this browser')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        setInterimTranscript('')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimText += result[0].transcript
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
        setInterimTranscript(interimText)

        // Reset timeout on new input
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Auto-stop after 5 seconds of silence
        timeoutRef.current = setTimeout(() => {
          stopListening()
        }, 5000)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)

        if (event.error === 'not-allowed') {
          onError?.('Microphone access denied. Please allow microphone access.')
        } else if (event.error !== 'aborted') {
          onError?.(`Speech recognition error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }

      recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      onError?.('Failed to start speech recognition')
    }
  }, [disabled, isSupported, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Submit the transcript
    const fullTranscript = transcript + interimTranscript
    if (fullTranscript.trim()) {
      onTranscript(fullTranscript.trim())
    }

    setInterimTranscript('')
  }, [transcript, interimTranscript, onTranscript])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    setTranscript('')
    setInterimTranscript('')
  }, [])

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Voice input not supported in this browser
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Voice button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          transition-all duration-200
          ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <span className="text-sm">Recording...</span>
          </>
        ) : (
          <>
            <span>🎤</span>
            <span className="text-sm">Voice Input</span>
          </>
        )}
      </button>

      {/* Live transcript preview */}
      {isListening && (transcript || interimTranscript) && (
        <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Live transcript:</span>
            <button
              onClick={cancelListening}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm">
            {transcript}
            <span className="text-gray-400">{interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isListening && (
        <p className="mt-2 text-xs text-gray-400">
          Click to start speaking. Recording stops after 5 seconds of silence.
        </p>
      )}
    </div>
  )
}
