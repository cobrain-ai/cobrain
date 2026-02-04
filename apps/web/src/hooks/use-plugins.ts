// Plugin System Hook
// Provides React integration for the CoBrain plugin system

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  getPluginRegistry,
  type Plugin,
  type PluginManifest,
  type PluginConfig,
  type PluginState,
  type PluginRegistryEvent,
} from '@cobrain/core'

/**
 * Plugin status information
 */
export interface PluginStatus {
  id: string
  name: string
  description: string
  version: string
  icon?: string
  state: PluginState
  enabled: boolean
  config: PluginConfig
}

/**
 * Hook for managing plugins
 */
export function usePlugins(userId: string) {
  const [plugins, setPlugins] = useState<PluginStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const registry = useMemo(() => getPluginRegistry(), [])

  // Update plugin list from registry
  const refreshPlugins = useCallback(() => {
    const manifests = registry.getAll()
    const statuses: PluginStatus[] = manifests.map((manifest) => ({
      id: manifest.meta.id,
      name: manifest.meta.name,
      description: manifest.meta.description,
      version: manifest.meta.version,
      icon: manifest.meta.icon,
      state: registry.getState(manifest.meta.id) || 'unloaded',
      enabled: registry.getState(manifest.meta.id) === 'active',
      config: registry.getConfig(manifest.meta.id) || {},
    }))
    setPlugins(statuses)
  }, [registry])

  // Subscribe to registry events
  useEffect(() => {
    const unsubscribe = registry.subscribe((event: PluginRegistryEvent) => {
      refreshPlugins()

      if (event.type === 'plugin:error') {
        console.error(`Plugin error (${event.pluginId}):`, event.error)
      }
    })

    refreshPlugins()
    setLoading(false)

    return unsubscribe
  }, [registry, refreshPlugins])

  // Enable a plugin
  const enablePlugin = useCallback(
    async (pluginId: string) => {
      try {
        await registry.enable(pluginId, userId)
        refreshPlugins()
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        throw err
      }
    },
    [registry, userId, refreshPlugins]
  )

  // Disable a plugin
  const disablePlugin = useCallback(
    async (pluginId: string) => {
      try {
        await registry.disable(pluginId)
        refreshPlugins()
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
        throw err
      }
    },
    [registry, refreshPlugins]
  )

  // Toggle a plugin
  const togglePlugin = useCallback(
    async (pluginId: string) => {
      const state = registry.getState(pluginId)
      if (state === 'active') {
        await disablePlugin(pluginId)
      } else {
        await enablePlugin(pluginId)
      }
    },
    [registry, enablePlugin, disablePlugin]
  )

  // Update plugin config
  const updateConfig = useCallback(
    (pluginId: string, config: Partial<PluginConfig>) => {
      registry.setConfig(pluginId, config)
      refreshPlugins()
    },
    [registry, refreshPlugins]
  )

  // Get a specific plugin instance
  const getPlugin = useCallback(
    <T extends Plugin>(pluginId: string): T | undefined => {
      return registry.get(pluginId) as T | undefined
    },
    [registry]
  )

  // Check if a plugin is active
  const isPluginActive = useCallback(
    (pluginId: string): boolean => {
      return registry.getState(pluginId) === 'active'
    },
    [registry]
  )

  return {
    plugins,
    loading,
    error,
    enablePlugin,
    disablePlugin,
    togglePlugin,
    updateConfig,
    getPlugin,
    isPluginActive,
    refreshPlugins,
  }
}

/**
 * Hook for accessing a specific plugin
 */
export function usePlugin<T extends Plugin>(pluginId: string): T | undefined {
  const registry = useMemo(() => getPluginRegistry(), [])
  const [plugin, setPlugin] = useState<T | undefined>(() => registry.get(pluginId) as T | undefined)

  useEffect(() => {
    const unsubscribe = registry.subscribe((event) => {
      if (event.pluginId === pluginId) {
        setPlugin(registry.get(pluginId) as T | undefined)
      }
    })

    // Initial check
    setPlugin(registry.get(pluginId) as T | undefined)

    return unsubscribe
  }, [registry, pluginId])

  return plugin
}

/**
 * Hook for plugin configuration
 */
export function usePluginConfig(pluginId: string) {
  const registry = useMemo(() => getPluginRegistry(), [])
  const [config, setConfigState] = useState<PluginConfig>(() => registry.getConfig(pluginId) || {})

  useEffect(() => {
    const unsubscribe = registry.subscribe((event) => {
      if (event.type === 'plugin:config-changed' && event.pluginId === pluginId) {
        setConfigState(event.config)
      }
    })

    return unsubscribe
  }, [registry, pluginId])

  const setConfig = useCallback(
    (newConfig: Partial<PluginConfig>) => {
      registry.setConfig(pluginId, newConfig)
    },
    [registry, pluginId]
  )

  return [config, setConfig] as const
}
