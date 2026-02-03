'use client'

import { useState, useEffect, useCallback } from 'react'
import { PROVIDERS, getDefaultProviderConfigs } from '@/lib/providers'
import type { ProviderStatus, ProviderConfig, ProviderConnectionStatus } from '@/lib/providers'

export type SaveStatus =
  | { type: 'idle' }
  | { type: 'saving' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }

interface UseProviderSettingsResult {
  providers: ProviderStatus[]
  activeProvider: string
  configs: Record<string, ProviderConfig>
  setActiveProvider: (id: string) => void
  updateConfig: (providerId: string, updates: Partial<ProviderConfig>) => void
  testProvider: (providerId: string) => Promise<void>
  checkAllProviders: () => Promise<void>
  saveConfig: () => Promise<boolean>
  isLoading: boolean
  saveStatus: SaveStatus
}

function createInitialProviders(): ProviderStatus[] {
  return PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    status: 'disconnected' as ProviderConnectionStatus,
    available: false,
  }))
}

export function useProviderSettings(): UseProviderSettingsResult {
  const [providers, setProviders] = useState<ProviderStatus[]>(createInitialProviders)
  const [activeProvider, setActiveProvider] = useState<string>('ollama')
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>(getDefaultProviderConfigs)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: 'idle' })

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/providers/config')
      const data = await response.json()

      if (data.activeProvider) {
        setActiveProvider(data.activeProvider)
      }
      if (data.configs) {
        setConfigs(data.configs)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }, [])

  const checkAllProviders = useCallback(async () => {
    try {
      const response = await fetch('/api/providers')
      const data = await response.json()

      if (data.providers) {
        setProviders(data.providers)
      }
    } catch (error) {
      console.error('Failed to check providers:', error)
    }
  }, [])

  useEffect(() => {
    async function initialize() {
      setIsLoading(true)
      await Promise.all([loadConfig(), checkAllProviders()])
      setIsLoading(false)
    }
    initialize()
  }, [loadConfig, checkAllProviders])

  const updateConfig = useCallback((providerId: string, updates: Partial<ProviderConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], ...updates },
    }))
  }, [])

  const updateProviderStatus = useCallback(
    (providerId: string, updates: Partial<ProviderStatus>) => {
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, ...updates } : p))
      )
    },
    []
  )

  const testProvider = useCallback(
    async (providerId: string) => {
      updateProviderStatus(providerId, { status: 'testing' })

      const provider = providers.find((p) => p.id === providerId)
      if (!provider) return

      const config = configs[providerId]

      try {
        const response = await fetch('/api/providers/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: provider.type, config }),
        })

        const result = await response.json()

        updateProviderStatus(providerId, {
          status: result.status,
          available: result.available,
          latency: result.latency,
          model: result.model,
          error: result.error,
        })
      } catch (error) {
        updateProviderStatus(providerId, {
          status: 'error',
          available: false,
          error: error instanceof Error ? error.message : 'Test failed',
        })
      }
    },
    [providers, configs, updateProviderStatus]
  )

  const saveConfig = useCallback(async (): Promise<boolean> => {
    setSaveStatus({ type: 'saving' })

    try {
      const response = await fetch('/api/providers/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProvider, configs }),
      })

      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Configuration saved successfully!' })
        setTimeout(() => setSaveStatus({ type: 'idle' }), 3000)
        return true
      }

      const data = await response.json().catch(() => ({}))
      const errorMessage = data.error || 'Failed to save configuration'
      setSaveStatus({ type: 'error', message: errorMessage })
      return false
    } catch (error) {
      console.error('Failed to save config:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred'
      setSaveStatus({ type: 'error', message: errorMessage })
      return false
    }
  }, [activeProvider, configs])

  return {
    providers,
    activeProvider,
    configs,
    setActiveProvider,
    updateConfig,
    testProvider,
    checkAllProviders,
    saveConfig,
    isLoading,
    saveStatus,
  }
}
