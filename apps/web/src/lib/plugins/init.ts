// Plugin System Initialization
// Sets up the plugin registry with official plugins

import { getPluginRegistry, type PluginManifest, type PluginFactory } from '@cobrain/core'

// Import official plugins
// Note: These imports will work once the plugins package is built
// For now, we define the plugins inline for development

/**
 * Initialize the plugin system with official plugins
 */
export async function initializePlugins(userId: string): Promise<void> {
  const registry = getPluginRegistry()

  // Register official plugins dynamically
  // This allows for lazy loading and code splitting
  try {
    // @ts-expect-error - @cobrain/plugins may not be built yet
    const pluginsModule = await import('@cobrain/plugins')

    // Register all official plugins
    pluginsModule.registerOfficialPlugins((manifest: PluginManifest, factory: PluginFactory) => {
      try {
        registry.register(manifest, factory)
      } catch (err) {
        // Plugin already registered, skip
        console.debug(`Plugin ${manifest.meta.id} already registered`)
      }
    })

    // Load plugins that are enabled by default
    const manifests = registry.getAll()
    for (const manifest of manifests) {
      if (manifest.defaultEnabled !== false) {
        try {
          await registry.load(manifest.meta.id, userId)
        } catch (err) {
          console.error(`Failed to load plugin ${manifest.meta.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('Failed to initialize plugins:', err)
    // Continue without plugins - the app should still work
  }
}

const DEFAULT_PLUGINS = ['reminders', 'entities', 'views', 'search']

/**
 * Get enabled plugins from local storage with validation
 */
export function getEnabledPlugins(): string[] {
  if (typeof window === 'undefined') return DEFAULT_PLUGINS

  try {
    const stored = localStorage.getItem('cobrain:enabled-plugins')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that result is an array of strings
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return parsed
      }
      // Clear corrupted data
      localStorage.removeItem('cobrain:enabled-plugins')
    }
  } catch {
    // Clear corrupted data on parse error
    localStorage.removeItem('cobrain:enabled-plugins')
  }

  return DEFAULT_PLUGINS
}

/**
 * Save enabled plugins to local storage
 */
export function saveEnabledPlugins(pluginIds: string[]): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('cobrain:enabled-plugins', JSON.stringify(pluginIds))
}

/**
 * Get plugin configuration from local storage with validation
 */
export function getPluginConfig(pluginId: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null

  const storageKey = `cobrain:plugin-config:${pluginId}`
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that result is an object (not array, not null)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
      // Clear corrupted data
      localStorage.removeItem(storageKey)
    }
  } catch {
    // Clear corrupted data on parse error
    localStorage.removeItem(storageKey)
  }

  return null
}

/**
 * Save plugin configuration to local storage
 */
export function savePluginConfig(pluginId: string, config: Record<string, unknown>): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(`cobrain:plugin-config:${pluginId}`, JSON.stringify(config))
}
