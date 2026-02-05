import { useEffect } from 'react'
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useNoteStore } from '@/stores/note-store'
import { formatRelativeDate } from '@/utils/date'

export function RecentNotes() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const router = useRouter()
  const { notes, isLoading, loadNotes } = useNoteStore()

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const recentNotes = notes.slice(0, 5)

  const surfaceColor = isDark ? 'bg-slate-800' : 'bg-white'
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryTextColor = isDark ? 'text-slate-400' : 'text-gray-500'

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <Text className={secondaryTextColor}>Loading notes...</Text>
      </View>
    )
  }

  if (recentNotes.length === 0) {
    return (
      <View className="items-center py-8">
        <Ionicons
          name="document-text-outline"
          size={48}
          color={isDark ? '#475569' : '#d1d5db'}
        />
        <Text className={`mt-3 ${secondaryTextColor}`}>No notes yet</Text>
        <Text className={`text-sm ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
          Capture your first thought above!
        </Text>
      </View>
    )
  }

  return (
    <View>
      {recentNotes.map((note) => (
        <TouchableOpacity
          key={note.id}
          className={`mb-3 p-4 rounded-xl border ${surfaceColor} ${borderColor}`}
          onPress={() => router.push(`/note/${note.id}`)}
          activeOpacity={0.7}
        >
          <Text className={`${textColor}`} numberOfLines={2}>
            {note.content}
          </Text>
          <View className="flex-row items-center mt-2">
            <Ionicons
              name="time-outline"
              size={14}
              color={isDark ? '#94a3b8' : '#9ca3af'}
            />
            <Text className={`ml-1 text-xs ${secondaryTextColor}`}>
              {formatRelativeDate(note.createdAt)}
            </Text>
            {note.source === 'voice' && (
              <>
                <View className="w-1 h-1 mx-2 rounded-full bg-gray-400" />
                <Ionicons
                  name="mic-outline"
                  size={14}
                  color={isDark ? '#94a3b8' : '#9ca3af'}
                />
              </>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {notes.length > 5 && (
        <TouchableOpacity
          className="items-center py-3"
          onPress={() => router.push('/(tabs)/notes')}
        >
          <Text className="text-primary font-medium">
            View all {notes.length} notes
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
