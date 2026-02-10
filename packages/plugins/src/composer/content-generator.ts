// AI Content Generator
// Generates platform-adapted content from notes using AI
// Modeled after OmniPost's services/ai/generator.ts

import type {
  Platform,
  AdaptedContent,
  WritingStyleGuide,
  LLMProvider,
  Note,
} from '@cobrain/core'
import { ContentPipeline } from '@cobrain/core'
import { buildSystemPrompt, buildUserPrompt } from './prompts.js'

export interface GenerateInput {
  sourceNotes: Pick<Note, 'id' | 'content'>[]
  targetPlatforms: Platform[]
  style?: WritingStyleGuide
  topic?: string
}

export interface GenerateResult {
  contents: Map<Platform, AdaptedContent>
  metadata: {
    processingTimeMs: number
    provider: string
  }
}

/**
 * Content generator that uses AI to create platform-adapted content from notes.
 */
export class ContentGenerator {
  constructor(private readonly provider: LLMProvider) {}

  /**
   * Generate content for multiple platforms from source notes.
   * Each platform gets its own AI generation call with platform-specific prompts.
   */
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const startTime = Date.now()
    const contents = new Map<Platform, AdaptedContent>()

    // Generate content for each platform (in parallel, like OmniPost's Promise.allSettled)
    const results = await Promise.allSettled(
      input.targetPlatforms.map(async (platform) => {
        const content = await this.generateForPlatform(
          platform,
          input.sourceNotes,
          input.style,
          input.topic
        )
        return { platform, content }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        contents.set(result.value.platform, result.value.content)
      }
    }

    return {
      contents,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        provider: this.provider.name,
      },
    }
  }

  /**
   * Generate content for a single platform.
   */
  async generateForPlatform(
    platform: Platform,
    notes: Pick<Note, 'id' | 'content'>[],
    style?: WritingStyleGuide,
    topic?: string
  ): Promise<AdaptedContent> {
    const systemPrompt = buildSystemPrompt(platform, style)
    const userPrompt = buildUserPrompt(notes, topic)

    const response = await this.provider.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: this.getMaxTokensForPlatform(platform),
      }
    )

    return this.parseResponse(platform, response.content)
  }

  /**
   * Regenerate content with user feedback.
   * From OmniPost's regeneratePost pattern.
   */
  async regenerate(
    platform: Platform,
    currentContent: string,
    feedback: string,
    style?: WritingStyleGuide
  ): Promise<AdaptedContent> {
    const systemPrompt = buildSystemPrompt(platform, style)

    const response = await this.provider.complete(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here is the current content:\n\n${currentContent}\n\nPlease revise based on this feedback:\n${feedback}`,
        },
      ],
      {
        temperature: 0.7,
        maxTokens: this.getMaxTokensForPlatform(platform),
      }
    )

    return this.parseResponse(platform, response.content)
  }

  private parseResponse(platform: Platform, content: string): AdaptedContent {
    // For social platforms, check if content needs to be split into threads
    const isSocial = ['threads', 'twitter', 'mastodon', 'bluesky', 'linkedin'].includes(platform)

    if (platform === 'threads' || platform === 'twitter') {
      // Split by --- separator (as instructed in prompts)
      const parts = content
        .split(/\n---\n|^---$/m)
        .map((p) => p.trim())
        .filter(Boolean)

      return {
        body: content,
        format: 'plaintext',
        threadParts: parts.length > 1 ? parts : undefined,
      }
    }

    if (isSocial) {
      return {
        body: content,
        format: 'plaintext',
      }
    }

    // Blog platforms - content is markdown
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : undefined
    const bodyWithoutTitle = titleMatch
      ? content.replace(/^#\s+.+$/m, '').trim()
      : content

    return {
      title,
      body: bodyWithoutTitle,
      format: 'markdown',
      excerpt: ContentPipeline.generateExcerpt(bodyWithoutTitle),
      seoMeta: {
        metaDescription: ContentPipeline.generateExcerpt(bodyWithoutTitle),
      },
    }
  }

  private getMaxTokensForPlatform(platform: Platform): number {
    // Token limits inspired by OmniPost's PLATFORM_TOKEN_LIMITS
    switch (platform) {
      case 'threads':
      case 'mastodon':
      case 'bluesky':
        return 500
      case 'twitter':
        return 1000
      case 'linkedin':
        return 1500
      case 'hashnode':
      case 'devto':
      case 'wordpress':
      case 'medium':
      case 'ghost':
        return 4000
      default:
        return 2000
    }
  }
}
