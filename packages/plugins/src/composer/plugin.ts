// Composer Plugin
// CoBrain plugin that integrates AI content generation with the publishing system

import {
  BasePlugin,
  type PluginMeta,
  type PluginConfigSchema,
  type PluginUIExtension,
  type PluginRoute,
  type PluginRouteRequest,
  type PluginRouteResponse,
  type Platform,
  type WritingStyleGuide,
} from '@cobrain/core'
import { ContentGenerator } from './content-generator.js'

/**
 * Composer Plugin for AI-powered content creation from notes.
 * Integrates with the publishing system to compose and publish content.
 */
export class ComposerPlugin extends BasePlugin {
  readonly meta: PluginMeta = {
    id: 'composer',
    name: 'Content Composer',
    description: 'AI-powered content composer for blogs and social media',
    version: '1.0.0',
    icon: '✍️',
  }

  readonly configSchema: PluginConfigSchema[] = [
    {
      key: 'enabled',
      label: 'Enable Composer',
      type: 'boolean',
      default: true,
      description: 'Enable AI content composition from notes',
    },
    {
      key: 'defaultPlatforms',
      label: 'Default target platforms',
      type: 'string',
      default: 'threads,hashnode',
      description: 'Comma-separated list of default platforms to generate content for',
    },
    {
      key: 'enrichWithWebSearch',
      label: 'Enrich with web search',
      type: 'boolean',
      default: false,
      description: 'Enhance content with web search results (requires internet)',
    },
  ]

  readonly uiExtensions: PluginUIExtension[] = [
    {
      location: 'note-actions',
      component: 'ComposeFromNote',
      order: 10,
    },
    {
      location: 'sidebar',
      component: 'ComposerSidebarItem',
      order: 30,
    },
    {
      location: 'settings',
      component: 'ComposerSettings',
      order: 20,
    },
  ]

  readonly routes: PluginRoute[] = [
    {
      method: 'POST',
      path: 'generate',
      handler: this.handleGenerate.bind(this),
    },
    {
      method: 'POST',
      path: 'regenerate',
      handler: this.handleRegenerate.bind(this),
    },
  ]

  private generator?: ContentGenerator

  async initialize(context: Parameters<typeof BasePlugin.prototype.initialize>[0]): Promise<void> {
    await super.initialize(context)

    if (context.provider) {
      this.generator = new ContentGenerator(context.provider)
    }

    this.log('info', 'Composer plugin initialized')
  }

  async dispose(): Promise<void> {
    this.generator = undefined
    await super.dispose()
  }

  private async handleGenerate(req: PluginRouteRequest): Promise<PluginRouteResponse> {
    if (!this.generator) {
      return {
        status: 503,
        body: { error: 'AI provider not available' },
      }
    }

    const { sourceNotes, targetPlatforms, style, topic } = req.body as {
      sourceNotes: { id: string; content: string }[]
      targetPlatforms: string[]
      style?: Record<string, unknown>
      topic?: string
    }

    if (!sourceNotes?.length) {
      return {
        status: 400,
        body: { error: 'At least one source note is required' },
      }
    }

    if (!targetPlatforms?.length) {
      return {
        status: 400,
        body: { error: 'At least one target platform is required' },
      }
    }

    try {
      const result = await this.generator.generate({
        sourceNotes,
        targetPlatforms: targetPlatforms as Platform[],
        style: style as WritingStyleGuide | undefined,
        topic,
      })

      // Convert Map to object for JSON serialization
      const contents: Record<string, unknown> = {}
      for (const [platform, content] of result.contents) {
        contents[platform] = content
      }

      return {
        status: 200,
        body: { contents, metadata: result.metadata },
      }
    } catch (error) {
      this.log('error', 'Content generation failed', error)
      return {
        status: 500,
        body: { error: 'Content generation failed' },
      }
    }
  }

  private async handleRegenerate(req: PluginRouteRequest): Promise<PluginRouteResponse> {
    if (!this.generator) {
      return {
        status: 503,
        body: { error: 'AI provider not available' },
      }
    }

    const { platform, currentContent, feedback, style } = req.body as {
      platform: string
      currentContent: string
      feedback: string
      style?: Record<string, unknown>
    }

    if (!platform || !currentContent || !feedback) {
      return {
        status: 400,
        body: { error: 'platform, currentContent, and feedback are required' },
      }
    }

    try {
      const content = await this.generator.regenerate(
        platform as Platform,
        currentContent,
        feedback,
        style as WritingStyleGuide | undefined,
      )

      return {
        status: 200,
        body: { content },
      }
    } catch (error) {
      this.log('error', 'Content regeneration failed', error)
      return {
        status: 500,
        body: { error: 'Content regeneration failed' },
      }
    }
  }
}

export function createComposerPlugin(): ComposerPlugin {
  return new ComposerPlugin()
}
