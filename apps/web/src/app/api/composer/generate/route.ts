import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { notesRepository, writingStyleGuidesRepository } from '@cobrain/database'
import { providerConfigStore } from '@/lib/provider-config-store'
import { createProvider } from '@/lib/providers'
import type { LLMProvider, Platform } from '@cobrain/core'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/composer/prompts'

const generateSchema = z.object({
  sourceNoteIds: z.array(z.string()).min(1, 'At least one source note is required'),
  targetPlatforms: z.array(z.string()).min(1, 'At least one target platform is required'),
  styleGuideId: z.string().optional(),
  topic: z.string().optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = generateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { sourceNoteIds, targetPlatforms, styleGuideId, topic } = result.data

  // Fetch source notes
  const notes = await notesRepository.findByIds(sourceNoteIds)
  if (notes.length === 0) {
    return NextResponse.json({ error: 'No valid source notes found' }, { status: 404 })
  }

  // Fetch style guide if specified
  let styleData: StyleData | undefined
  if (styleGuideId) {
    const guide = await writingStyleGuidesRepository.findById(styleGuideId)
    if (guide) {
      styleData = {
        tone: guide.tone,
        language: guide.language,
        targetAudience: guide.targetAudience ?? undefined,
        customToneDescription: guide.customToneDescription ?? undefined,
        samplePost: guide.samplePost ?? undefined,
        rules: (guide.rules as Array<{ type: string; description: string }>) ?? [],
        serviceOverrides: (guide.serviceOverrides as Record<string, unknown>) ?? {},
      }
    }
  }

  // Get AI provider
  const provider = await getProviderForUser(session.user.id)
  if (!provider) {
    return NextResponse.json(
      { error: 'No AI provider available. Please configure one in Settings.' },
      { status: 503 }
    )
  }

  try {
    const startTime = Date.now()
    const contents: Record<string, unknown> = {}

    // Generate content for each platform in parallel
    const results = await Promise.allSettled(
      targetPlatforms.map(async (platform) => {
        const systemPrompt = buildSystemPrompt(platform as Platform, styleData)
        const userPrompt = buildUserPrompt(
          notes.map((n) => ({ content: n.content })),
          topic
        )

        const response = await provider.complete(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { temperature: 0.7, maxTokens: getMaxTokens(platform) }
        )

        return { platform, content: parseResponse(platform, response.content) }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        contents[result.value.platform] = result.value.content
      }
    }

    return NextResponse.json({
      contents,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        provider: provider.name,
      },
    })
  } catch (error) {
    console.error('Content generation failed:', error)
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  } finally {
    await provider.dispose()
  }
}

interface StyleData {
  tone: string
  language: string
  targetAudience?: string
  customToneDescription?: string
  samplePost?: string
  rules: Array<{ type: string; description: string }>
  serviceOverrides: Record<string, unknown>
}

function parseResponse(platform: string, content: string) {
  const isSocial = ['threads', 'twitter', 'mastodon', 'bluesky', 'linkedin'].includes(platform)

  if (platform === 'threads' || platform === 'twitter') {
    const parts = content
      .split(/\n---\n|^---$/m)
      .map((p) => p.trim())
      .filter(Boolean)
    return { body: content, format: 'plaintext', threadParts: parts.length > 1 ? parts : undefined }
  }

  if (isSocial) {
    return { body: content, format: 'plaintext' }
  }

  // Blog platforms
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : undefined
  const bodyWithoutTitle = titleMatch ? content.replace(/^#\s+.+$/m, '').trim() : content
  return {
    title,
    body: bodyWithoutTitle,
    format: 'markdown',
    excerpt: bodyWithoutTitle.substring(0, 160).replace(/\n/g, ' ').trim(),
  }
}

function getMaxTokens(platform: string): number {
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

async function getProviderForUser(userId: string): Promise<LLMProvider | null> {
  const userConfig = providerConfigStore.get(userId)
  const activeConfig = userConfig.configs[userConfig.activeProvider]

  const provider = createProvider({
    type: activeConfig?.type ?? 'ollama',
    config: activeConfig,
  })

  if (provider) {
    try {
      await provider.initialize()
      if (await provider.isAvailable()) return provider
      await provider.dispose()
    } catch {
      try { await provider.dispose() } catch { /* ignore */ }
    }
  }

  // Fallback to Ollama
  const fallback = createProvider({ type: 'ollama' })
  if (fallback) {
    try {
      await fallback.initialize()
      if (await fallback.isAvailable()) return fallback
      await fallback.dispose()
    } catch {
      try { await fallback.dispose() } catch { /* ignore */ }
    }
  }

  return null
}
