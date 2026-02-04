// Base Plugin Class
// Abstract base class with common plugin functionality

import type {
  Plugin,
  PluginMeta,
  PluginState,
  PluginContext,
  PluginConfigSchema,
  PluginEntityType,
  PluginViewTemplate,
  PluginUIExtension,
  PluginRoute,
  NoteProcessingHook,
} from './types.js'
import type { LLMProvider } from '../types/index.js'

/**
 * Abstract base class for plugins
 * Provides common functionality and default implementations
 */
export abstract class BasePlugin implements Plugin {
  protected state: PluginState = 'unloaded'
  protected context?: PluginContext

  /**
   * Plugin metadata - must be implemented by subclass
   */
  abstract readonly meta: PluginMeta

  /**
   * Optional configuration schema
   */
  readonly configSchema?: PluginConfigSchema[]

  /**
   * Optional entity types provided by this plugin
   */
  readonly entityTypes?: PluginEntityType[]

  /**
   * Optional view templates provided by this plugin
   */
  readonly viewTemplates?: PluginViewTemplate[]

  /**
   * Optional UI extensions
   */
  readonly uiExtensions?: PluginUIExtension[]

  /**
   * Optional API routes
   */
  readonly routes?: PluginRoute[]

  /**
   * Optional note processing hooks
   */
  readonly hooks?: NoteProcessingHook

  /**
   * Initialize the plugin
   * Override to add custom initialization logic
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context
    this.state = 'active'
    this.log('info', `Plugin initialized`)
  }

  /**
   * Dispose the plugin
   * Override to add custom cleanup logic
   */
  async dispose(): Promise<void> {
    this.log('info', `Plugin disposed`)
    this.state = 'unloaded'
    this.context = undefined
  }

  /**
   * Get current plugin state
   */
  getState(): PluginState {
    return this.state
  }

  /**
   * Get a configuration value
   */
  protected getConfigValue<T>(key: string, defaultValue: T): T {
    if (!this.context?.config) return defaultValue
    const value = this.context.config[key]
    return value !== undefined ? (value as T) : defaultValue
  }

  /**
   * Log a message using the plugin context logger
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    if (this.context?.log) {
      this.context.log(level, message, data)
    } else {
      console[level](`[Plugin:${this.meta.id}]`, message, data)
    }
  }

  /**
   * Get the current user ID
   */
  protected get userId(): string | undefined {
    return this.context?.userId
  }

  /**
   * Get the LLM provider
   */
  protected get provider(): LLMProvider | undefined {
    return this.context?.provider
  }
}
