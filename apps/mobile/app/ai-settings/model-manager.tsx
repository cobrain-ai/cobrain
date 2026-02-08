import { useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useLocalLLMStore } from '@/stores/local-llm-store'
import { getAvailableModels, formatModelSize } from '@/providers/model-catalog'
import {
  downloadModel as downloadModelFile,
  cancelDownload,
  deleteModelFile,
} from '@/providers/model-download-service'
import type { LocalModel, DownloadedModel } from '@cobrain/core'

function ModelCard({
  model,
  downloaded,
  isActive,
  onDownload,
  onDelete,
  onSelect,
}: {
  model: LocalModel
  downloaded: DownloadedModel | undefined
  isActive: boolean
  onDownload: () => void
  onDelete: () => void
  onSelect: () => void
}) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-gray-500'
  const isBuiltIn = model.sizeBytes === 0

  const qualityLabels = { basic: 'Basic', good: 'Good', better: 'Better' }
  const speedLabels = { 'very-fast': 'Very Fast', fast: 'Fast', medium: 'Medium' }

  return (
    <TouchableOpacity
      className={`px-4 py-4 ${
        isActive ? (isDark ? 'bg-slate-800/50' : 'bg-blue-50/50') : ''
      }`}
      onPress={() => {
        if (downloaded || isBuiltIn) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onSelect()
        }
      }}
      activeOpacity={downloaded || isBuiltIn ? 0.7 : 1}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            <Text className={`text-base font-semibold ${textColor}`}>
              {model.name}
            </Text>
            {isActive && (
              <View className="ml-2 bg-primary px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-medium">Active</Text>
              </View>
            )}
          </View>
          <Text className={`text-sm mt-0.5 ${secondaryText}`}>
            {model.parameters} params · {formatModelSize(model.sizeBytes)}
          </Text>
          <Text className={`text-sm mt-0.5 ${secondaryText}`}>
            {speedLabels[model.speed]} · {qualityLabels[model.quality]} quality
          </Text>
          <Text className={`text-xs mt-1 ${secondaryText}`}>
            {model.description}
          </Text>
        </View>

        <View>
          {isBuiltIn ? (
            <View className="bg-green-500/20 px-3 py-1.5 rounded-lg">
              <Text className="text-green-500 text-sm font-medium">Built-in</Text>
            </View>
          ) : downloaded ? (
            <TouchableOpacity
              className="bg-red-500/10 px-3 py-1.5 rounded-lg"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onDelete()
              }}
            >
              <Text className="text-red-500 text-sm font-medium">Delete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-primary/10 px-3 py-1.5 rounded-lg"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                onDownload()
              }}
            >
              <Text className="text-primary text-sm font-medium">Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

function DownloadProgressBar() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { currentDownload, setDownloadProgress } = useLocalLLMStore()

  if (!currentDownload || currentDownload.status !== 'downloading') return null

  const progress = currentDownload.totalBytes > 0
    ? (currentDownload.bytesDownloaded / currentDownload.totalBytes) * 100
    : 0

  return (
    <View className={`mx-4 mb-4 p-4 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Downloading...
        </Text>
        <TouchableOpacity
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            await cancelDownload()
            setDownloadProgress(null)
          }}
        >
          <Text className="text-red-500 text-sm font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>
      <View className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {formatModelSize(currentDownload.bytesDownloaded)} / {formatModelSize(currentDownload.totalBytes)}
        </Text>
        <Text className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {progress.toFixed(0)}%
        </Text>
      </View>
    </View>
  )
}

export default function ModelManagerScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const router = useRouter()

  const {
    downloadedModels,
    activeModelId,
    currentDownload,
    loadState,
    setActiveModel,
    addDownloadedModel,
    removeDownloadedModel,
    setDownloadProgress,
  } = useLocalLLMStore()

  const isDownloading = currentDownload?.status === 'downloading'

  useEffect(() => {
    loadState()
  }, [])

  const bgColor = isDark ? 'bg-background-dark' : 'bg-surface'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const secondaryText = isDark ? 'text-slate-400' : 'text-gray-500'
  const surfaceColor = isDark ? 'bg-slate-900' : 'bg-white'
  const borderColor = isDark ? 'border-slate-800' : 'border-gray-100'

  const availableModels = getAvailableModels()

  // On iOS, apple-foundation is always "downloaded" (built-in)
  const isAppleBuiltIn = Platform.OS === 'ios'
  const modelsWithDownloadStatus = availableModels.map((model) => ({
    model,
    downloaded: downloadedModels.find((d) => d.id === model.id),
    isBuiltIn: model.id === 'apple-foundation' && isAppleBuiltIn,
  }))

  const downloadedSection = modelsWithDownloadStatus.filter(
    (m) => m.downloaded || m.isBuiltIn
  )
  const availableSection = modelsWithDownloadStatus.filter(
    (m) => !m.downloaded && !m.isBuiltIn
  )

  const totalStorageUsed = downloadedModels.reduce((sum, m) => sum + m.sizeBytes, 0)

  function handleDelete(modelId: string) {
    const model = downloadedModels.find((m) => m.id === modelId)
    if (!model) return

    Alert.alert(
      'Delete Model',
      `Delete "${model.name}"? This will free ${formatModelSize(model.sizeBytes)} of storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModelFile(modelId)
              removeDownloadedModel(modelId)
            } catch {
              Alert.alert('Error', 'Failed to delete model file.')
            }
          },
        },
      ]
    )
  }

  function handleDownload(model: LocalModel) {
    if (isDownloading) return
    Alert.alert(
      'Download Model',
      `Download "${model.name}" (${formatModelSize(model.sizeBytes)})?\n\nThis requires a Wi-Fi connection and may take several minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              const downloaded = await downloadModelFile(model, (progress) => {
                setDownloadProgress(progress)
              })
              addDownloadedModel(downloaded)
              setDownloadProgress(null)
              Alert.alert('Download Complete', `"${model.name}" is ready to use.`)
            } catch (error) {
              setDownloadProgress(null)
              if (error instanceof Error && error.message.includes('cancelled')) {
                return
              }
              Alert.alert(
                'Download Failed',
                error instanceof Error ? error.message : 'An unknown error occurred.',
              )
            }
          },
        },
      ]
    )
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
        <Text className={`text-xl font-bold ${textColor}`}>Model Manager</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <DownloadProgressBar />

        {/* Downloaded Models */}
        {downloadedSection.length > 0 && (
          <View className="mb-6">
            <Text
              className={`px-4 pb-2 text-sm font-medium uppercase ${
                isDark ? 'text-slate-500' : 'text-gray-500'
              }`}
            >
              Downloaded
            </Text>
            <View className={`rounded-2xl overflow-hidden mx-4 ${surfaceColor}`}>
              {downloadedSection.map((item, index) => (
                <View
                  key={item.model.id}
                  className={index > 0 ? `border-t ${borderColor}` : ''}
                >
                  <ModelCard
                    model={item.model}
                    downloaded={item.downloaded}
                    isActive={activeModelId === item.model.id || (item.isBuiltIn && !activeModelId)}
                    onDownload={() => {}}
                    onDelete={() => handleDelete(item.model.id)}
                    onSelect={() => setActiveModel(item.model.id)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Available Models */}
        {availableSection.length > 0 && (
          <View className="mb-6">
            <Text
              className={`px-4 pb-2 text-sm font-medium uppercase ${
                isDark ? 'text-slate-500' : 'text-gray-500'
              }`}
            >
              Available
            </Text>
            <View className={`rounded-2xl overflow-hidden mx-4 ${surfaceColor}`}>
              {availableSection.map((item, index) => (
                <View
                  key={item.model.id}
                  className={index > 0 ? `border-t ${borderColor}` : ''}
                >
                  <ModelCard
                    model={item.model}
                    downloaded={undefined}
                    isActive={false}
                    onDownload={() => handleDownload(item.model)}
                    onDelete={() => {}}
                    onSelect={() => {}}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Storage Info */}
        <View className="mb-6">
          <View className={`rounded-2xl overflow-hidden mx-4 p-4 ${surfaceColor}`}>
            <View className="flex-row items-center">
              <Ionicons
                name="folder-outline"
                size={18}
                color={isDark ? '#94a3b8' : '#6b7280'}
              />
              <Text className={`text-sm ml-2 ${secondaryText}`}>
                Storage used by models: {formatModelSize(totalStorageUsed)}
              </Text>
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}
