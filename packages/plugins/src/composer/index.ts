// Composer Plugin Exports

export { ComposerPlugin, createComposerPlugin } from './plugin.js'
export { ContentGenerator } from './content-generator.js'
export type { GenerateInput, GenerateResult } from './content-generator.js'
export { buildSystemPrompt, buildUserPrompt } from './prompts.js'

import type { PluginManifest } from '@cobrain/core'

export const manifest: PluginManifest = {
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
