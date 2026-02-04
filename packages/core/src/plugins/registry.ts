// Plugin Registry
// Central management for plugin lifecycle and discovery

import type {
  Plugin,
  PluginFactory,
  PluginManifest,
  PluginConfig,
  PluginContext,
  PluginState,
  PluginRegistryEvent,
  PluginRegistryListener,
  ExtractionResult,
} from './types.js'
import type { Note, LLMProvider } from '../types/index.js'

/**
 * Registered plugin entry with runtime state
 */
interface RegisteredPlugin {
  manifest: PluginManifest
  factory: PluginFactory
  instance?: Plugin
  state: PluginState
  config: PluginConfig
  error?: Error
}

/**
 * Plugin Registry
 * Singleton that manages all plugins in the system
 */
export class PluginRegistry {
  private static instance: PluginRegistry | null = null

  private plugins: Map<string, RegisteredPlugin> = new Map()
  private listeners: Set<PluginRegistryListener> = new Set()
  private provider?: LLMProvider

  private constructor() {}

  /**
   * Get the singleton registry instance
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry()
    }
    return PluginRegistry.instance
  }

  /**
   * Reset the registry (mainly for testing)
   */
  static reset(): void {
    if (PluginRegistry.instance) {
      PluginRegistry.instance.dispose()
      PluginRegistry.instance = null
    }
  }

  /**
   * Set the LLM provider for plugins to use
   */
  setProvider(provider: LLMProvider): void {
    this.provider = provider
  }

  /**
   * Register a plugin with its manifest and factory
   * @param configDefaults - Optional default config to avoid instantiating plugin just for schema
   */
  register(manifest: PluginManifest, factory: PluginFactory, configDefaults?: PluginConfig): void {
    const { id } = manifest.meta

    if (this.plugins.has(id)) {
      throw new Error(`Plugin "${id}" is already registered`)
    }

    // Use provided defaults or create temporary instance to get schema
    let defaultConfig: PluginConfig = {}
    if (configDefaults) {
      defaultConfig = { ...configDefaults }
    } else {
      // Create temporary instance to read config schema, then dispose
      const tempPlugin = factory()
      if (tempPlugin.configSchema) {
        for (const schema of tempPlugin.configSchema) {
          defaultConfig[schema.key] = schema.default
        }
      }
      // Dispose if the plugin has resources (defensive)
      if (typeof tempPlugin.dispose === 'function') {
        tempPlugin.dispose().catch(() => {})
      }
    }

    this.plugins.set(id, {
      manifest,
      factory,
      state: 'unloaded',
      config: defaultConfig,
    })

    this.emit({ type: 'plugin:registered', pluginId: id })
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId)
    if (!registered) {
      return
    }

    if (registered.instance) {
      await this.unload(pluginId)
    }

    this.plugins.delete(pluginId)
  }

  /**
   * Load and initialize a plugin
   */
  async load(pluginId: string, userId: string): Promise<void> {
    const registered = this.plugins.get(pluginId)
    if (!registered) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }

    if (registered.state === 'active') {
      return // Already loaded
    }

    // Check dependencies
    const deps = registered.manifest.dependencies || []
    for (const depId of deps) {
      const dep = this.plugins.get(depId)
      if (!dep || dep.state !== 'active') {
        throw new Error(`Plugin "${pluginId}" requires "${depId}" to be loaded first`)
      }
    }

    registered.state = 'loading'

    try {
      const instance = registered.factory()
      const context = this.createContext(pluginId, userId, registered.config)

      await instance.initialize(context)

      registered.instance = instance
      registered.state = 'active'
      registered.error = undefined

      this.emit({ type: 'plugin:loaded', pluginId })
    } catch (error) {
      registered.state = 'error'
      registered.error = error instanceof Error ? error : new Error(String(error))
      this.emit({ type: 'plugin:error', pluginId, error: registered.error })
      throw error
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId: string): Promise<void> {
    const registered = this.plugins.get(pluginId)
    if (!registered?.instance) {
      return
    }

    // Check for dependent plugins
    for (const [id, plugin] of this.plugins) {
      if (plugin.manifest.dependencies?.includes(pluginId) && plugin.state === 'active') {
        throw new Error(`Cannot unload "${pluginId}": plugin "${id}" depends on it`)
      }
    }

    await registered.instance.dispose()
    registered.instance = undefined
    registered.state = 'unloaded'

    this.emit({ type: 'plugin:unloaded', pluginId })
  }

  /**
   * Enable a plugin (load it)
   */
  async enable(pluginId: string, userId: string): Promise<void> {
    const registered = this.plugins.get(pluginId)
    if (!registered) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }

    if (registered.state === 'disabled') {
      registered.state = 'unloaded'
    }

    await this.load(pluginId, userId)
  }

  /**
   * Disable a plugin (unload and mark as disabled)
   */
  async disable(pluginId: string): Promise<void> {
    await this.unload(pluginId)

    const registered = this.plugins.get(pluginId)
    if (registered) {
      registered.state = 'disabled'
    }
  }

  /**
   * Update plugin configuration
   */
  setConfig(pluginId: string, config: Partial<PluginConfig>): void {
    const registered = this.plugins.get(pluginId)
    if (!registered) {
      throw new Error(`Plugin "${pluginId}" is not registered`)
    }

    registered.config = { ...registered.config, ...config }
    this.emit({ type: 'plugin:config-changed', pluginId, config: registered.config })
  }

  /**
   * Get plugin configuration
   */
  getConfig(pluginId: string): PluginConfig | undefined {
    return this.plugins.get(pluginId)?.config
  }

  /**
   * Get a loaded plugin instance
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.instance
  }

  /**
   * Get plugin state
   */
  getState(pluginId: string): PluginState | undefined {
    return this.plugins.get(pluginId)?.state
  }

  /**
   * Get all registered plugin manifests
   */
  getAll(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest)
  }

  /**
   * Get all active plugins
   */
  getActive(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.instance && p.state === 'active')
      .map((p) => p.instance!)
  }

  /**
   * Process a note through all active plugins
   */
  async processNote(
    note: Note,
    userId: string,
    event: 'created' | 'updated',
    previousNote?: Note
  ): Promise<Map<string, ExtractionResult>> {
    const results = new Map<string, ExtractionResult>()

    for (const plugin of this.getActive()) {
      if (!plugin.hooks) continue

      const context = this.createContext(plugin.meta.id, userId, this.getConfig(plugin.meta.id) || {})

      try {
        let result: ExtractionResult | undefined

        if (event === 'created' && plugin.hooks.onNoteCreated) {
          result = await plugin.hooks.onNoteCreated(note, context)
        } else if (event === 'updated' && plugin.hooks.onNoteUpdated && previousNote) {
          result = await plugin.hooks.onNoteUpdated(note, previousNote, context)
        }

        if (result) {
          results.set(plugin.meta.id, result)
        }
      } catch (error) {
        console.error(`Plugin "${plugin.meta.id}" failed to process note:`, error)
        this.emit({
          type: 'plugin:error',
          pluginId: plugin.meta.id,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }

    return results
  }

  /**
   * Handle note deletion for all active plugins
   */
  async handleNoteDeleted(noteId: string, userId: string): Promise<void> {
    for (const plugin of this.getActive()) {
      if (!plugin.hooks?.onNoteDeleted) continue

      const context = this.createContext(plugin.meta.id, userId, this.getConfig(plugin.meta.id) || {})

      try {
        await plugin.hooks.onNoteDeleted(noteId, context)
      } catch (error) {
        console.error(`Plugin "${plugin.meta.id}" failed to handle note deletion:`, error)
      }
    }
  }

  /**
   * Subscribe to registry events
   */
  subscribe(listener: PluginRegistryListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Dispose of all plugins and clean up
   */
  async dispose(): Promise<void> {
    // Unload all plugins in reverse order
    const pluginIds = Array.from(this.plugins.keys()).reverse()
    for (const id of pluginIds) {
      try {
        await this.unload(id)
      } catch {
        // Ignore errors during disposal
      }
    }

    this.plugins.clear()
    this.listeners.clear()
  }

  private createContext(pluginId: string, userId: string, config: PluginConfig): PluginContext {
    return {
      userId,
      provider: this.provider,
      config,
      log: (level, message, data) => {
        const prefix = `[Plugin:${pluginId}]`
        switch (level) {
          case 'debug':
            console.debug(prefix, message, data)
            break
          case 'info':
            console.info(prefix, message, data)
            break
          case 'warn':
            console.warn(prefix, message, data)
            break
          case 'error':
            console.error(prefix, message, data)
            break
        }
      },
    }
  }

  private emit(event: PluginRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Plugin registry listener error:', error)
      }
    }
  }
}

/**
 * Get the global plugin registry
 */
export function getPluginRegistry(): PluginRegistry {
  return PluginRegistry.getInstance()
}
