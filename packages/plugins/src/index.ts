// @cobrain/plugins - Official CoBrain Plugins
// Core plugins for reminders, entities, views, search, publishing, and composer

// Plugin exports (existing)
export * from './reminders/index.js'
export * from './entities/index.js'
export * from './views/index.js'
export * from './search/index.js'

// Composer plugin exports (named to avoid manifest collision)
export { ComposerPlugin, createComposerPlugin } from './composer/plugin.js'
export { ContentGenerator } from './composer/content-generator.js'
export type { GenerateInput, GenerateResult } from './composer/content-generator.js'
export { buildSystemPrompt, buildUserPrompt } from './composer/prompts.js'

// Publishing adapter exports (named to avoid collision)
export {
  ThreadsAdapter,
  createThreadsAdapter,
} from './publishing/threads/adapter.js'
export {
  HashnodeAdapter,
  createHashnodeAdapter,
} from './publishing/hashnode/adapter.js'
export {
  TwitterAdapter,
  createTwitterAdapter,
} from './publishing/twitter/adapter.js'
export {
  publishingServices,
  registerPublishingServices,
} from './publishing/index.js'

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

// Import composer manifest separately
import type { PluginManifest } from '@cobrain/core'
const composerManifest: PluginManifest = {
  meta: {
    id: 'composer',
    name: 'Content Composer',
    description: 'AI-powered content composer for blogs and social media',
    version: '1.0.0',
    icon: '✍️',
  },
  entry: './composer/plugin.js',
  dependencies: [],
  defaultEnabled: true,
}

// Import factories
import { createRemindersPlugin } from './reminders/index.js'
import { createEntitiesPlugin } from './entities/index.js'
import { createViewsPlugin } from './views/index.js'
import { createSearchPlugin } from './search/index.js'
import { createComposerPlugin } from './composer/plugin.js'

/**
 * All official plugin manifests
 */
export const officialPlugins = [
  remindersManifest,
  entitiesManifest,
  viewsManifest,
  searchManifest,
  composerManifest,
]

/**
 * Plugin factory map for easy instantiation
 */
export const pluginFactories = {
  reminders: createRemindersPlugin,
  entities: createEntitiesPlugin,
  views: createViewsPlugin,
  search: createSearchPlugin,
  composer: createComposerPlugin,
} as const

/**
 * Register all official plugins with a registry
 */
export function registerOfficialPlugins(
  register: (manifest: PluginManifest, factory: () => unknown) => void
): void {
  register(remindersManifest, createRemindersPlugin)
  register(entitiesManifest, createEntitiesPlugin)
  register(viewsManifest, createViewsPlugin)
  register(searchManifest, createSearchPlugin)
  register(composerManifest, createComposerPlugin)
}
