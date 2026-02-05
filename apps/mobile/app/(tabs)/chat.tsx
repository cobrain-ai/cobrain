import { useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ChatMessage, useChatStore } from '@/stores/chat-store'

function MessageBubble({ message }: { message: ChatMessage }) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const isUser = message.role === 'user'

  return (
    <View
      className={`max-w-[80%] mb-3 ${isUser ? 'self-end' : 'self-start'}`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary rounded-br-md'
            : isDark
              ? 'bg-slate-800 rounded-bl-md'
              : 'bg-gray-100 rounded-bl-md'
        }`}
      >
        <Text
          className={`text-base ${
            isUser ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {message.content}
        </Text>
      </View>
      <Text
        className={`text-xs mt-1 ${
          isUser ? 'text-right' : 'text-left'
        } ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
      >
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  )
}

export default function ChatScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [input, setInput] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const { messages, isLoading, sendMessage } = useChatStore()

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await sendMessage(userMessage)
  }, [input, isLoading, sendMessage])

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages])

  const bgColor = isDark ? 'bg-background-dark' : 'bg-background'
  const surfaceColor = isDark ? 'bg-surface-dark' : 'bg-surface'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200'

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View className={`px-4 py-3 border-b ${borderColor}`}>
          <Text className={`text-xl font-bold ${textColor}`}>
            Chat with CoBrain
          </Text>
          <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Ask me anything about your notes
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={isDark ? '#475569' : '#d1d5db'}
              />
              <Text className={`mt-4 text-base ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Start a conversation
              </Text>
              <Text className={`text-sm ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>
                Ask about your notes, tasks, or anything!
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View
          className={`flex-row items-end px-4 py-3 border-t ${borderColor} ${surfaceColor}`}
        >
          <TextInput
            className={`flex-1 min-h-[44px] max-h-[120px] px-4 py-3 rounded-2xl ${
              isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            placeholder="Type a message..."
            placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            className={`ml-2 p-3 rounded-full ${
              input.trim() ? 'bg-primary' : isDark ? 'bg-slate-700' : 'bg-gray-200'
            }`}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Ionicons
                name="ellipsis-horizontal"
                size={24}
                color={isDark ? '#94a3b8' : '#9ca3af'}
              />
            ) : (
              <Ionicons
                name="send"
                size={24}
                color={input.trim() ? '#ffffff' : isDark ? '#94a3b8' : '#9ca3af'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
