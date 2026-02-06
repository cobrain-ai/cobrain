import { useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSettingsStore } from '@/stores/settings-store'
import { useLocalLLMStore } from '@/stores/local-llm-store'

type ProviderOption = {
  id: 'local-llm' | 'ollama' | 'openai' | 'anthropic'
  name: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  requiresSetup: boolean
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'local-llm',
    name: 'On-Device AI',
    description: Platform.OS === 'ios'
      ? 'Private · No internet · Built-in'
      : 'Private · No internet · Download required',
    icon: 'phone-portrait-outline',
    requiresSetup: Platform.OS !== 'ios',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local server required',
    icon: 'server-outline',
    requiresSetup: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'API key required · Cloud',
    icon: 'sparkles-outline',
    requiresSetup: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'API key required · Cloud',
    icon: 'chatbubble-ellipses-outline',
    requiresSetup: true,
  },
]

export default function AISettingsScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const router = useRouter()

  const { aiProvider, setAiProvider } = useSettingsStore()
  const { downloadedModels, activeModelId, loadState } = useLocalLLMStore()

  useEffect(() => {
    loadState()
  }, [])

  const bgColor = isDark ? 'bg-background-dark' : 'bg-surface'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-gray-500'
  const surfaceColor = isDark ? 'bg-slate-900' : 'bg-white'
  const borderColor = isDark ? 'border-slate-800' : 'border-gray-100'

  function getLocalLLMStatus(): string {
    if (Platform.OS === 'ios') {
      return 'Ready (Apple Intelligence)'
    }
    if (downloadedModels.length === 0) {
      return 'No models downloaded'
    }
    const active = downloadedModels.find((m) => m.id === activeModelId)
    return active ? `Active: ${active.name}` : `${downloadedModels.length} model(s) downloaded`
  }

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.back()
          }}
          className="mr-3 p-1"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? '#ffffff' : '#111827'}
          />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${textColor}`}>AI Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Provider Selection */}
        <View className="mb-6">
          <Text
            className={`px-4 pb-2 text-sm font-medium uppercase ${
              isDark ? 'text-slate-500' : 'text-gray-500'
            }`}
          >
            Provider
          </Text>
          <View className={`rounded-2xl overflow-hidden mx-4 ${surfaceColor}`}>
            {PROVIDERS.map((provider, index) => {
              const isSelected = aiProvider === provider.id
              return (
                <TouchableOpacity
                  key={provider.id}
                  className={`flex-row items-center px-4 py-4 ${
                    index > 0 ? `border-t ${borderColor}` : ''
                  } ${isSelected ? (isDark ? 'bg-slate-800/50' : 'bg-blue-50/50') : ''}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setAiProvider(provider.id)
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center ${
                      isSelected
                        ? 'bg-primary'
                        : isDark
                          ? 'bg-slate-800'
                          : 'bg-gray-100'
                    }`}
                  >
                    <Ionicons
                      name={provider.icon}
                      size={22}
                      color={isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#6b7280'}
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text
                      className={`text-base font-medium ${
                        isSelected
                          ? isDark
                            ? 'text-white'
                            : 'text-primary'
                          : textColor
                      }`}
                    >
                      {provider.name}
                    </Text>
                    <Text className={`text-sm ${secondaryText}`}>
                      {provider.description}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      isSelected
                        ? 'border-primary bg-primary'
                        : isDark
                          ? 'border-slate-600'
                          : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* On-Device Models section (only when local-llm is selected) */}
        {aiProvider === 'local-llm' && (
          <View className="mb-6">
            <Text
              className={`px-4 pb-2 text-sm font-medium uppercase ${
                isDark ? 'text-slate-500' : 'text-gray-500'
              }`}
            >
              On-Device Models
            </Text>
            <View className={`rounded-2xl overflow-hidden mx-4 ${surfaceColor}`}>
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  router.push('/ai-settings/model-manager')
                }}
                activeOpacity={0.7}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    isDark ? 'bg-slate-800' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name="cube-outline"
                    size={22}
                    color={isDark ? '#94a3b8' : '#6b7280'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={`text-base ${textColor}`}>Manage Models</Text>
                  <Text className={`text-sm ${secondaryText}`}>
                    {getLocalLLMStatus()}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? '#475569' : '#d1d5db'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status */}
        <View className="mb-6">
          <Text
            className={`px-4 pb-2 text-sm font-medium uppercase ${
              isDark ? 'text-slate-500' : 'text-gray-500'
            }`}
          >
            Status
          </Text>
          <View className={`rounded-2xl overflow-hidden mx-4 p-4 ${surfaceColor}`}>
            <View className="flex-row items-center mb-2">
              <Text className={`text-sm ${secondaryText} w-20`}>Provider</Text>
              <Text className={`text-sm font-medium ${textColor}`}>
                {aiProvider
                  ? PROVIDERS.find((p) => p.id === aiProvider)?.name ?? aiProvider
                  : 'Not configured'}
              </Text>
            </View>
            {aiProvider === 'local-llm' && (
              <>
                <View className="flex-row items-center mb-2">
                  <Text className={`text-sm ${secondaryText} w-20`}>Model</Text>
                  <Text className={`text-sm font-medium ${textColor}`}>
                    {activeModelId
                      ? downloadedModels.find((m) => m.id === activeModelId)?.name ?? activeModelId
                      : 'None'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className={`text-sm ${secondaryText} w-20`}>Status</Text>
                  <View className="flex-row items-center">
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${
                        downloadedModels.length > 0 || Platform.OS === 'ios'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <Text className={`text-sm font-medium ${textColor}`}>
                      {downloadedModels.length > 0 || Platform.OS === 'ios'
                        ? 'Ready'
                        : 'Model needed'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}
