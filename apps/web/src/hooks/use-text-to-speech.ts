// Text-to-Speech Hook
// Provides TTS functionality using the Web Speech API

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface TTSSettings {
  enabled: boolean
  autoRead: boolean
  rate: number // 0.1 to 10, default 1
  pitch: number // 0 to 2, default 1
  volume: number // 0 to 1, default 1
  voiceURI?: string // Selected voice URI
}

export interface TTSState {
  isSupported: boolean
  isSpeaking: boolean
  isPaused: boolean
  voices: SpeechSynthesisVoice[]
  currentVoice: SpeechSynthesisVoice | null
}

const DEFAULT_SETTINGS: TTSSettings = {
  enabled: false,
  autoRead: false,
  rate: 1,
  pitch: 1,
  volume: 1,
}

const STORAGE_KEY = 'cobrain:tts-settings'

/**
 * Load TTS settings from localStorage
 */
function loadSettings(): TTSSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }

  return DEFAULT_SETTINGS
}

/**
 * Save TTS settings to localStorage
 */
function saveSettings(settings: TTSSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/**
 * Hook for text-to-speech functionality
 */
export function useTextToSpeech() {
  const [settings, setSettingsState] = useState<TTSSettings>(DEFAULT_SETTINGS)
  const [state, setState] = useState<TTSState>({
    isSupported: false,
    isSpeaking: false,
    isPaused: false,
    voices: [],
    currentVoice: null,
  })

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === 'undefined') return

    const synth = window.speechSynthesis
    if (!synth) {
      setState((s) => ({ ...s, isSupported: false }))
      return
    }

    synthRef.current = synth
    setState((s) => ({ ...s, isSupported: true }))

    // Load saved settings
    const savedSettings = loadSettings()
    setSettingsState(savedSettings)

    // Load voices
    const loadVoices = () => {
      const availableVoices = synth.getVoices()
      if (availableVoices.length > 0) {
        // Find the saved voice or default to first English voice
        let selectedVoice = availableVoices.find((v) => v.voiceURI === savedSettings.voiceURI)
        if (!selectedVoice) {
          selectedVoice =
            availableVoices.find((v) => v.lang.startsWith('en') && v.default) ||
            availableVoices.find((v) => v.lang.startsWith('en')) ||
            availableVoices[0]
        }

        setState((s) => ({
          ...s,
          voices: availableVoices,
          currentVoice: selectedVoice || null,
        }))
      }
    }

    // Voices may load asynchronously
    loadVoices()
    synth.addEventListener('voiceschanged', loadVoices)

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices)
      synth.cancel()
    }
  }, [])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings }
      saveSettings(updated)
      return updated
    })
  }, [])

  // Select a voice
  const selectVoice = useCallback(
    (voiceURI: string) => {
      const voice = state.voices.find((v) => v.voiceURI === voiceURI)
      if (voice) {
        setState((s) => ({ ...s, currentVoice: voice }))
        updateSettings({ voiceURI })
      }
    },
    [state.voices, updateSettings]
  )

  // Speak text
  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current || !state.isSupported || !settings.enabled) {
        return
      }

      // Cancel any ongoing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = settings.rate
      utterance.pitch = settings.pitch
      utterance.volume = settings.volume

      if (state.currentVoice) {
        utterance.voice = state.currentVoice
      }

      utterance.onstart = () => {
        setState((s) => ({ ...s, isSpeaking: true, isPaused: false }))
      }

      utterance.onend = () => {
        setState((s) => ({ ...s, isSpeaking: false, isPaused: false }))
      }

      utterance.onerror = (event) => {
        console.error('TTS error:', event.error)
        setState((s) => ({ ...s, isSpeaking: false, isPaused: false }))
      }

      utteranceRef.current = utterance
      synthRef.current.speak(utterance)
    },
    [settings, state.isSupported, state.currentVoice]
  )

  // Pause speech
  const pause = useCallback(() => {
    if (synthRef.current && state.isSpeaking) {
      synthRef.current.pause()
      setState((s) => ({ ...s, isPaused: true }))
    }
  }, [state.isSpeaking])

  // Resume speech
  const resume = useCallback(() => {
    if (synthRef.current && state.isPaused) {
      synthRef.current.resume()
      setState((s) => ({ ...s, isPaused: false }))
    }
  }, [state.isPaused])

  // Stop speech
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setState((s) => ({ ...s, isSpeaking: false, isPaused: false }))
    }
  }, [])

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (state.isPaused) {
      resume()
    } else if (state.isSpeaking) {
      pause()
    }
  }, [state.isPaused, state.isSpeaking, pause, resume])

  // Auto-read function for new messages
  const autoRead = useCallback(
    (text: string) => {
      if (settings.enabled && settings.autoRead) {
        speak(text)
      }
    },
    [settings.enabled, settings.autoRead, speak]
  )

  return {
    // State
    ...state,
    settings,

    // Actions
    speak,
    pause,
    resume,
    stop,
    togglePause,
    autoRead,

    // Settings
    updateSettings,
    selectVoice,

    // Convenience
    toggle: () => updateSettings({ enabled: !settings.enabled }),
    toggleAutoRead: () => updateSettings({ autoRead: !settings.autoRead }),
  }
}

export type UseTextToSpeechReturn = ReturnType<typeof useTextToSpeech>
