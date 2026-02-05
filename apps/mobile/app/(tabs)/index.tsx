import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { VoiceInput } from '@/components/voice-input'
import { RecentNotes } from '@/components/recent-notes'
import { useNoteStore } from '@/stores/note-store'

export default function CaptureScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const addNote = useNoteStore((state) => state.addNote)

  const handleSave = useCallback(async () => {
    if (!content.trim() || isSaving) return

    setIsSaving(true)
    try {
      await addNote(content)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setContent('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)
    } catch (error) {
      console.error('Failed to save note:', error)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsSaving(false)
    }
  }, [content, isSaving, addNote])

  const handleVoiceResult = useCallback((transcript: string) => {
    setContent((prev) => (prev ? `${prev} ${transcript}` : transcript))
    setIsVoiceMode(false)
  }, [])

  const bgColor = isDark ? 'bg-background-dark' : 'bg-background'
  const surfaceColor = isDark ? 'bg-surface-dark' : 'bg-surface'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryTextColor = isDark ? 'text-slate-400' : 'text-gray-500'
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200'

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className={`text-2xl font-bold ${textColor}`}>CoBrain</Text>
          <TouchableOpacity
            className="p-2"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={isDark ? '#f8fafc' : '#111827'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick Capture Card */}
          <View
            className={`rounded-2xl ${surfaceColor} p-4 mb-6 border ${borderColor}`}
          >
            {showSuccess ? (
              <View className="items-center py-8">
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                <Text className="text-green-500 font-medium mt-2">
                  Note saved!
                </Text>
              </View>
            ) : isVoiceMode ? (
              <VoiceInput
                onResult={handleVoiceResult}
                onCancel={() => setIsVoiceMode(false)}
              />
            ) : (
              <>
                <TextInput
                  className={`${textColor} text-base min-h-[120px] mb-4`}
                  placeholder="What's on your mind?"
                  placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
                  multiline
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                />

                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    className="p-3 rounded-full bg-red-500/10"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                      setIsVoiceMode(true)
                    }}
                  >
                    <Ionicons name="mic" size={24} color="#ef4444" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`px-6 py-3 rounded-xl ${
                      content.trim()
                        ? 'bg-primary'
                        : isDark
                          ? 'bg-slate-700'
                          : 'bg-gray-200'
                    }`}
                    onPress={handleSave}
                    disabled={!content.trim() || isSaving}
                  >
                    <Text
                      className={`font-semibold ${
                        content.trim() ? 'text-white' : secondaryTextColor
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Recent Notes */}
          <Text className={`text-lg font-semibold ${textColor} mb-3`}>
            Recent Notes
          </Text>
          <RecentNotes />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
