import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useNoteStore, Note } from '@/stores/note-store'
import { formatRelativeDate } from '@/utils/date'

function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <TouchableOpacity
      className={`mb-3 p-4 rounded-xl border ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
        numberOfLines={3}
      >
        {note.content}
      </Text>
      <View className="flex-row items-center mt-2">
        <Ionicons
          name="time-outline"
          size={14}
          color={isDark ? '#94a3b8' : '#9ca3af'}
        />
        <Text className={`ml-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
  )
}

export default function NotesScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { notes, loadNotes } = useNoteStore()

  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadNotes()
    setIsRefreshing(false)
  }, [loadNotes])

  const bgColor = isDark ? 'bg-background-dark' : 'bg-background'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200'

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={['top']}>
      {/* Header */}
      <View className={`px-4 py-3 border-b ${borderColor}`}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className={`text-2xl font-bold ${textColor}`}>Notes</Text>
          <TouchableOpacity
            className="p-2"
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons
              name="add-circle"
              size={28}
              color="#2563eb"
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          className={`flex-row items-center px-4 py-2 rounded-xl ${
            isDark ? 'bg-slate-800' : 'bg-gray-100'
          }`}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? '#94a3b8' : '#9ca3af'}
          />
          <TextInput
            className={`flex-1 ml-2 text-base ${textColor}`}
            placeholder="Search notes..."
            placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? '#94a3b8' : '#9ca3af'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => router.push(`/note/${item.id}`)}
          />
        )}
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#94a3b8' : '#9ca3af'}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons
              name="document-text-outline"
              size={64}
              color={isDark ? '#475569' : '#d1d5db'}
            />
            <Text className={`mt-4 text-base ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {searchQuery ? 'No matching notes' : 'No notes yet'}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>
              {searchQuery ? 'Try a different search' : 'Capture your first thought!'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}
