// Plugin System Types
// Core plugin architecture for CoBrain extensibility

import type { Note, Entity, LLMProvider } from '../types/index.js'

/**
 * Plugin metadata for identification and display
 */
export interface PluginMeta {
  /** Unique plugin identifier (e.g., 'reminders', 'entities') */
  id: string
  /** Human-readable name */
  name: string
  /** Short description */
  description: string
  /** Semantic version */
  version: string
  /** Plugin author */
  author?: string
  /** Plugin homepage/docs URL */
  homepage?: string
  /** Plugin icon (emoji or URL) */
  icon?: string
}

/**
 * Plugin lifecycle state
 */
export type PluginState = 'unloaded' | 'loading' | 'active' | 'error' | 'disabled'

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  /** Configuration key */
  key: string
  /** Display label */
  label: string
  /** Config type */
  type: 'boolean' | 'string' | 'number' | 'select'
  /** Default value */
  default: unknown
  /** Description/help text */
  description?: string
  /** Options for select type */
  options?: { label: string; value: string | number }[]
}

/**
 * Plugin configuration values
 */
export type PluginConfig = Record<string, unknown>

/**
 * Context provided to plugins during processing
 */
export interface PluginContext {
  /** Current user ID */
  userId: string
  /** LLM provider for AI operations */
  provider?: LLMProvider
  /** Plugin's configuration */
  config: PluginConfig
  /** Logger function */
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => void
}

/**
 * Result from plugin extraction
 */
export interface ExtractionResult<T = unknown> {
  /** Extracted items */
  items: T[]
  /** Processing metadata */
  metadata?: {
    processingTimeMs: number
    confidence?: number
    source?: 'rule' | 'llm' | 'hybrid'
  }
}

/**
 * Hook for processing notes
 */
export interface NoteProcessingHook {
  /** Called when a new note is created */
  onNoteCreated?: (note: Note, context: PluginContext) => Promise<ExtractionResult>
  /** Called when a note is updated */
  onNoteUpdated?: (note: Note, previousNote: Note, context: PluginContext) => Promise<ExtractionResult>
  /** Called when a note is deleted */
  onNoteDeleted?: (noteId: string, context: PluginContext) => Promise<void>
}

/**
 * API route definition for plugins
 */
export interface PluginRoute {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Route path (relative to /api/plugins/{pluginId}/) */
  path: string
  /** Route handler */
  handler: (req: PluginRouteRequest) => Promise<PluginRouteResponse>
}

export interface PluginRouteRequest {
  method: string
  path: string
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
  context: PluginContext
}

export interface PluginRouteResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

/**
 * UI extension point for plugins
 */
export interface PluginUIExtension {
  /** Extension point location */
  location: 'sidebar' | 'settings' | 'note-actions' | 'capture-toolbar' | 'dashboard-widget'
  /** Component identifier */
  component: string
  /** Component props */
  props?: Record<string, unknown>
  /** Display order (lower = first) */
  order?: number
}

/**
 * Entity type registration for knowledge graph
 */
export interface PluginEntityType {
  /** Entity type identifier */
  type: string
  /** Display name */
  name: string
  /** Icon (emoji or URL) */
  icon?: string
  /** Color for visualization */
  color?: string
  /** Extraction patterns (regex) */
  patterns?: RegExp[]
}

/**
 * View template provided by plugin
 */
export interface PluginViewTemplate {
  /** Template identifier */
  id: string
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Icon */
  icon?: string
  /** Default query/filter */
  defaultQuery: Record<string, unknown>
  /** Default layout */
  defaultLayout?: 'list' | 'grid' | 'kanban' | 'timeline' | 'table'
}

/**
 * Core plugin interface
 * All plugins must implement this interface
 */
export interface Plugin {
  /** Plugin metadata */
  readonly meta: PluginMeta

  /** Configuration schema */
  readonly configSchema?: PluginConfigSchema[]

  /** Entity types this plugin provides */
  readonly entityTypes?: PluginEntityType[]

  /** View templates this plugin provides */
  readonly viewTemplates?: PluginViewTemplate[]

  /** UI extensions */
  readonly uiExtensions?: PluginUIExtension[]

  /** API routes */
  readonly routes?: PluginRoute[]

  /**
   * Initialize the plugin
   * Called when plugin is loaded
   */
  initialize(context: PluginContext): Promise<void>

  /**
   * Dispose the plugin
   * Called when plugin is unloaded
   */
  dispose(): Promise<void>

  /**
   * Get current plugin state
   */
  getState(): PluginState

  /**
   * Note processing hooks
   */
  readonly hooks?: NoteProcessingHook
}

/**
 * Plugin factory function type
 */
export type PluginFactory = () => Plugin

/**
 * Plugin manifest for discovery
 */
export interface PluginManifest {
  /** Plugin metadata */
  meta: PluginMeta
  /** Entry point (module path) */
  entry: string
  /** Dependencies on other plugins */
  dependencies?: string[]
  /** Required core version */
  coreVersion?: string
  /** Default enabled state */
  defaultEnabled?: boolean
}

/**
 * Plugin registry events
 */
export type PluginRegistryEvent =
  | { type: 'plugin:registered'; pluginId: string }
  | { type: 'plugin:loaded'; pluginId: string }
  | { type: 'plugin:unloaded'; pluginId: string }
  | { type: 'plugin:error'; pluginId: string; error: Error }
  | { type: 'plugin:config-changed'; pluginId: string; config: PluginConfig }

export type PluginRegistryListener = (event: PluginRegistryEvent) => void
