import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface SettingsState {
  notificationsEnabled: boolean
  syncEnabled: boolean
  aiProvider: 'ollama' | 'openai' | 'anthropic' | null
  isLoading: boolean
  loadSettings: () => Promise<void>
  setNotificationsEnabled: (enabled: boolean) => Promise<void>
  setSyncEnabled: (enabled: boolean) => Promise<void>
  setAiProvider: (provider: 'ollama' | 'openai' | 'anthropic' | null) => Promise<void>
}

const SETTINGS_STORAGE_KEY = '@cobrain_settings'

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notificationsEnabled: true,
  syncEnabled: true,
  aiProvider: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      if (stored) {
        const settings = JSON.parse(stored)
        set({
          notificationsEnabled: settings.notificationsEnabled ?? true,
          syncEnabled: settings.syncEnabled ?? true,
          aiProvider: settings.aiProvider ?? null,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      set({ isLoading: false })
    }
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled })
    await saveSettings(get())
  },

  setSyncEnabled: async (enabled: boolean) => {
    set({ syncEnabled: enabled })
    await saveSettings(get())
  },

  setAiProvider: async (provider) => {
    set({ aiProvider: provider })
    await saveSettings(get())
  },
}))

async function saveSettings(state: SettingsState) {
  try {
    await AsyncStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        notificationsEnabled: state.notificationsEnabled,
        syncEnabled: state.syncEnabled,
        aiProvider: state.aiProvider,
      })
    )
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}
