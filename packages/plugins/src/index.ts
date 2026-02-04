// @cobrain/plugins - Official CoBrain Plugins
// Core plugins for reminders, entities, views, and search

// Plugin exports
export * from './reminders/index.js'
export * from './entities/index.js'
export * from './views/index.js'
export * from './search/index.js'

// Re-export plugin types from core
export type {
  Plugin,
  PluginMeta,
  PluginState,
  PluginConfig,
  PluginConfigSchema,
  PluginContext,
  PluginFactory,
  PluginManifest,
  PluginEntityType,
  PluginViewTemplate,
  PluginUIExtension,
  PluginRoute,
  NoteProcessingHook,
  ExtractionResult,
} from '@cobrain/core'

// Import manifests
import { manifest as remindersManifest } from './reminders/index.js'
import { manifest as entitiesManifest } from './entities/index.js'
import { manifest as viewsManifest } from './views/index.js'
import { manifest as searchManifest } from './search/index.js'

// Import factories
import { createRemindersPlugin } from './reminders/index.js'
import { createEntitiesPlugin } from './entities/index.js'
import { createViewsPlugin } from './views/index.js'
import { createSearchPlugin } from './search/index.js'

/**
 * All official plugin manifests
 */
export const officialPlugins = [
  remindersManifest,
  entitiesManifest,
  viewsManifest,
  searchManifest,
]

/**
 * Plugin factory map for easy instantiation
 */
export const pluginFactories = {
  reminders: createRemindersPlugin,
  entities: createEntitiesPlugin,
  views: createViewsPlugin,
  search: createSearchPlugin,
} as const

/**
 * Register all official plugins with a registry
 */
export function registerOfficialPlugins(
  register: (manifest: typeof remindersManifest, factory: () => unknown) => void
): void {
  register(remindersManifest, createRemindersPlugin)
  register(entitiesManifest, createEntitiesPlugin)
  register(viewsManifest, createViewsPlugin)
  register(searchManifest, createSearchPlugin)
}
