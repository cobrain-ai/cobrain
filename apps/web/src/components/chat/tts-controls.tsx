'use client'

import { Volume2, VolumeX, Pause, Play, Square, Settings } from 'lucide-react'
import { useState } from 'react'
import type { UseTextToSpeechReturn } from '@/hooks/use-text-to-speech'

interface TTSControlsProps {
  tts: UseTextToSpeechReturn
}

export function TTSControls({ tts }: TTSControlsProps) {
  const [showSettings, setShowSettings] = useState(false)

  if (!tts.isSupported) {
    return null
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {/* Main toggle */}
        <button
          onClick={tts.toggle}
          className={`p-2 rounded-lg transition-colors ${
            tts.settings.enabled
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={tts.settings.enabled ? 'Disable voice responses' : 'Enable voice responses'}
        >
          {tts.settings.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>

        {/* Playback controls (only show when speaking) */}
        {tts.isSpeaking && (
          <>
            <button
              onClick={tts.togglePause}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title={tts.isPaused ? 'Resume' : 'Pause'}
            >
              {tts.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              onClick={tts.stop}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${
            showSettings
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Voice settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Settings dropdown */}
      {showSettings && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <h3 className="font-medium text-sm mb-3">Voice Settings</h3>

          {/* Auto-read toggle */}
          <label className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-read responses</span>
            <button
              onClick={tts.toggleAutoRead}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                tts.settings.autoRead ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  tts.settings.autoRead ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>

          {/* Voice selection */}
          {tts.voices.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Voice</label>
              <select
                value={tts.currentVoice?.voiceURI || ''}
                onChange={(e) => tts.selectVoice(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                {tts.voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Speed control */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Speed: {tts.settings.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={tts.settings.rate}
              onChange={(e) => tts.updateSettings({ rate: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Pitch control */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Pitch: {tts.settings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={tts.settings.pitch}
              onChange={(e) => tts.updateSettings({ pitch: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Volume control */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Volume: {Math.round(tts.settings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={tts.settings.volume}
              onChange={(e) => tts.updateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Test button */}
          <button
            onClick={() => tts.speak('Hello! This is a test of the text to speech feature.')}
            className="mt-4 w-full py-2 px-3 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={!tts.settings.enabled}
          >
            Test Voice
          </button>
        </div>
      )}
    </div>
  )
}
