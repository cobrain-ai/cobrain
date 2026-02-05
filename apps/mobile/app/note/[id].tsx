import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useNoteStore } from '@/stores/note-store'
import { formatRelativeDate } from '@/utils/date'

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const { notes, updateNote, deleteNote } = useNoteStore()
  const note = notes.find((n) => n.id === id)

  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note?.content || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!id || !editContent.trim()) return

    setIsSaving(true)
    try {
      await updateNote(id, editContent)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update note:', error)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsSaving(false)
    }
  }, [id, editContent, updateNote])

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(id!)
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              )
              router.back()
            } catch (error) {
              console.error('Failed to delete note:', error)
            }
          },
        },
      ]
    )
  }, [id, deleteNote, router])

  const bgColor = isDark ? 'bg-background-dark' : 'bg-background'
  const surfaceColor = isDark ? 'bg-slate-800' : 'bg-white'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryTextColor = isDark ? 'text-slate-400' : 'text-gray-500'
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200'

  if (!note) {
    return (
      <SafeAreaView className={`flex-1 ${bgColor}`}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Note',
            headerStyle: { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
            headerTintColor: isDark ? '#f8fafc' : '#111827',
          }}
        />
        <View className="flex-1 items-center justify-center">
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={isDark ? '#475569' : '#d1d5db'}
          />
          <Text className={`mt-4 ${secondaryTextColor}`}>Note not found</Text>
          <TouchableOpacity
            className="mt-4 px-4 py-2 rounded-lg bg-primary"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Note',
          headerStyle: { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
          headerTintColor: isDark ? '#f8fafc' : '#111827',
          headerRight: () => (
            <View className="flex-row items-center">
              {isEditing ? (
                <>
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={() => {
                      setEditContent(note.content)
                      setIsEditing(false)
                    }}
                  >
                    <Text className={secondaryTextColor}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2"
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    <Text className="text-primary font-medium">
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons
                      name="pencil"
                      size={22}
                      color="#2563eb"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity className="p-2" onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1 px-4 py-4">
        {/* Metadata */}
        <View className="flex-row items-center mb-4">
          <Ionicons
            name="time-outline"
            size={16}
            color={isDark ? '#94a3b8' : '#9ca3af'}
          />
          <Text className={`ml-1 text-sm ${secondaryTextColor}`}>
            Created {formatRelativeDate(note.createdAt)}
          </Text>
          {note.source === 'voice' && (
            <>
              <View className="w-1 h-1 mx-2 rounded-full bg-gray-400" />
              <Ionicons
                name="mic-outline"
                size={16}
                color={isDark ? '#94a3b8' : '#9ca3af'}
              />
              <Text className={`ml-1 text-sm ${secondaryTextColor}`}>
                Voice note
              </Text>
            </>
          )}
        </View>

        {/* Content */}
        <View className={`rounded-2xl ${surfaceColor} p-4 border ${borderColor}`}>
          {isEditing ? (
            <TextInput
              className={`${textColor} text-base min-h-[200px]`}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text className={`${textColor} text-base leading-6`}>
              {note.content}
            </Text>
          )}
        </View>

        {/* Related entities placeholder */}
        <View className="mt-6">
          <Text className={`text-sm font-medium ${secondaryTextColor} mb-2`}>
            Extracted Entities
          </Text>
          <View
            className={`rounded-xl ${surfaceColor} p-4 border ${borderColor} items-center`}
          >
            <Text className={secondaryTextColor}>
              AI entity extraction coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
