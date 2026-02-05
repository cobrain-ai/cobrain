import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated'

interface VoiceInputProps {
  onResult: (transcript: string) => void
  onCancel: () => void
}

export function VoiceInput({ onResult, onCancel }: VoiceInputProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Pulse animation for recording indicator
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withRepeat(
          withSequence(
            withTiming(1.2, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          true
        ),
      },
    ],
    opacity: withRepeat(
      withSequence(
        withTiming(0.5, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    ),
  }))

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript('')
      setIsRecording(true)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

      // Note: In a real implementation, you would use @react-native-voice/voice
      // For now, we'll simulate voice input
      // Voice.onSpeechResults = (e) => setTranscript(e.value?.[0] || '')
      // await Voice.start('en-US')

      // Simulated transcript for demo
      setTimeout(() => {
        setTranscript('This is a simulated voice transcription...')
      }, 2000)
    } catch (e) {
      console.error('Failed to start recording:', e)
      setError('Failed to start voice recognition')
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // In real implementation: await Voice.stop()

      if (transcript) {
        onResult(transcript)
      }
    } catch (e) {
      console.error('Failed to stop recording:', e)
    }
  }, [transcript, onResult])

  useEffect(() => {
    // Auto-start recording when component mounts
    startRecording()

    return () => {
      // Cleanup: stop recording when component unmounts
      // In real implementation: Voice.destroy()
    }
  }, [startRecording])

  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryTextColor = isDark ? 'text-slate-400' : 'text-gray-500'

  return (
    <View className="items-center py-8">
      {/* Recording Indicator */}
      <View className="relative mb-6">
        {isRecording && (
          <Animated.View
            style={[pulseStyle]}
            className="absolute inset-0 rounded-full bg-red-500/30"
          />
        )}
        <TouchableOpacity
          className={`w-20 h-20 rounded-full items-center justify-center ${
            isRecording ? 'bg-red-500' : isDark ? 'bg-slate-700' : 'bg-gray-200'
          }`}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={32}
            color={isRecording ? '#ffffff' : isDark ? '#94a3b8' : '#6b7280'}
          />
        </TouchableOpacity>
      </View>

      {/* Status Text */}
      <Text className={`text-lg font-medium mb-2 ${textColor}`}>
        {isRecording ? 'Listening...' : 'Tap to start'}
      </Text>

      {/* Transcript Preview */}
      {transcript ? (
        <Text
          className={`text-center px-4 ${secondaryTextColor}`}
          numberOfLines={3}
        >
          "{transcript}"
        </Text>
      ) : (
        <Text className={`text-center px-4 ${secondaryTextColor}`}>
          Speak clearly into your microphone
        </Text>
      )}

      {/* Error */}
      {error && <Text className="text-red-500 mt-2">{error}</Text>}

      {/* Actions */}
      <View className="flex-row mt-6 space-x-4">
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${
            isDark ? 'bg-slate-700' : 'bg-gray-200'
          }`}
          onPress={onCancel}
        >
          <Text className={secondaryTextColor}>Cancel</Text>
        </TouchableOpacity>

        {transcript && (
          <TouchableOpacity
            className="px-4 py-2 rounded-lg bg-primary"
            onPress={() => onResult(transcript)}
          >
            <Text className="text-white font-medium">Use Text</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
