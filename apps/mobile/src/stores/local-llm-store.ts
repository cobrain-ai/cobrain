import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  LocalModel,
  DownloadedModel,
  ModelDownloadProgress,
  ModelDownloadStatus,
} from '@cobrain/core/src/types'

interface LocalLLMState {
  // Downloaded models
  downloadedModels: DownloadedModel[]
  activeModelId: string | null

  // Download state
  currentDownload: ModelDownloadProgress | null

  // Loading state
  isLoading: boolean

  // Actions
  loadState: () => Promise<void>
  setActiveModel: (modelId: string) => Promise<void>
  addDownloadedModel: (model: DownloadedModel) => Promise<void>
  removeDownloadedModel: (modelId: string) => Promise<void>
  setDownloadProgress: (progress: ModelDownloadProgress | null) => void
}

const STORAGE_KEY = '@cobrain_local_llm'

export const useLocalLLMStore = create<LocalLLMState>((set, get) => ({
  downloadedModels: [],
  activeModelId: null,
  currentDownload: null,
  isLoading: false,

  loadState: async () => {
    set({ isLoading: true })
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        set({
          downloadedModels: (data.downloadedModels ?? []).map((m: DownloadedModel) => ({
            ...m,
            downloadedAt: new Date(m.downloadedAt),
          })),
          activeModelId: data.activeModelId ?? null,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load local LLM state:', error)
      set({ isLoading: false })
    }
  },

  setActiveModel: async (modelId: string) => {
    set({ activeModelId: modelId })
    await persistState(get())
  },

  addDownloadedModel: async (model: DownloadedModel) => {
    const current = get().downloadedModels
    const updated = [...current.filter((m) => m.id !== model.id), model]
    set({
      downloadedModels: updated,
      activeModelId: get().activeModelId ?? model.id,
    })
    await persistState(get())
  },

  removeDownloadedModel: async (modelId: string) => {
    const current = get().downloadedModels
    const updated = current.filter((m) => m.id !== modelId)
    const activeModelId =
      get().activeModelId === modelId
        ? updated[0]?.id ?? null
        : get().activeModelId
    set({ downloadedModels: updated, activeModelId })
    await persistState(get())
  },

  setDownloadProgress: (progress: ModelDownloadProgress | null) => {
    set({ currentDownload: progress })
  },
}))

async function persistState(state: LocalLLMState) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        downloadedModels: state.downloadedModels,
        activeModelId: state.activeModelId,
      })
    )
  } catch (error) {
    console.error('Failed to persist local LLM state:', error)
  }
}
