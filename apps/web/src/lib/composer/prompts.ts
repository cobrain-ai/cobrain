/**
 * Per-platform prompt templates for AI content generation.
 * Mirrors the prompts from @cobrain/plugins/composer but kept local
 * to avoid requiring the plugins package at build time.
 */

interface StyleData {
  tone: string
  language: string
  targetAudience?: string
  customToneDescription?: string
  samplePost?: string
  rules: Array<{ type: string; description: string }>
  serviceOverrides: Record<string, unknown>
}

export function buildSystemPrompt(platform: string, style?: StyleData): string {
  const styleInstructions = style ? buildStyleInstructions(style, platform) : ''
  const platformPrompt = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.default
  return `${platformPrompt}\n\n${styleInstructions}`.trim()
}

export function buildUserPrompt(
  notes: { content: string }[],
  topic?: string
): string {
  const noteContent = notes
    .map((n, i) => `--- Note ${i + 1} ---\n${n.content}`)
    .join('\n\n')

  return `${topic ? `Topic: ${topic}\n\n` : ''}Source material from my notes:\n\n${noteContent}\n\nPlease generate content based on the above notes.`
}

function buildStyleInstructions(style: StyleData, platform: string): string {
  const override = style.serviceOverrides?.[platform] as Partial<StyleData> | undefined
  const effectiveStyle = override ? { ...style, ...override } : style

  const parts: string[] = ['Writing Style Instructions:']

  if (effectiveStyle.tone !== 'custom') {
    parts.push(`- Tone: ${effectiveStyle.tone}`)
  } else if (effectiveStyle.customToneDescription) {
    parts.push(`- Tone: ${effectiveStyle.customToneDescription}`)
  }

  if (effectiveStyle.language) {
    parts.push(`- Language: ${effectiveStyle.language}`)
  }

  if (effectiveStyle.targetAudience) {
    parts.push(`- Target audience: ${effectiveStyle.targetAudience}`)
  }

  if (effectiveStyle.rules?.length) {
    parts.push('- Style rules:')
    for (const rule of effectiveStyle.rules) {
      parts.push(`  - ${rule.type}: ${rule.description}`)
    }
  }

  if (effectiveStyle.samplePost) {
    parts.push(`\nReference sample post (match this style):\n${effectiveStyle.samplePost}`)
  }

  return parts.join('\n')
}

const PLATFORM_PROMPTS: Record<string, string> = {
  threads: `You are an expert Threads content creator.
Create 1-3 engaging Threads posts based on the provided notes.

Guidelines:
- Each post maximum 500 characters
- Use emojis sparingly but effectively
- Be conversational and engaging
- Include a call-to-action when appropriate
- Format: Return each post separated by ---`,

  twitter: `You are an expert Twitter/X content creator.
Create a compelling Twitter thread (3-8 tweets) based on the provided notes.

Guidelines:
- First tweet must be a hook that grabs attention
- Each tweet maximum 280 characters
- Use emojis sparingly
- Include relevant hashtags (2-3 max)
- End with a call-to-action
- Format: Return each tweet separated by ---`,

  hashnode: `You are an expert technical blogger.
Write a comprehensive blog post (1000-2500 words) in Markdown based on the provided notes.

Guidelines:
- SEO-optimized title
- Clear H2/H3 heading structure
- Include code examples if relevant
- Add a meta description (150-160 chars)
- Conclude with a clear takeaway or CTA
- Format: Start with title as # heading`,

  wordpress: `You are an expert blog writer.
Write a well-structured blog post (800-2000 words) in Markdown based on the provided notes.

Guidelines:
- Engaging title
- Clear paragraph structure with H2/H3 headings
- Scannable format with short paragraphs
- Include a compelling introduction
- End with a conclusion and CTA`,

  medium: `You are an expert Medium writer.
Write an engaging article (800-2000 words) in Markdown based on the provided notes.

Guidelines:
- Captivating title and subtitle
- Strong opening hook
- Use pull quotes for key insights
- Include personal perspective where appropriate
- Conversational yet authoritative tone`,

  linkedin: `You are an expert LinkedIn content creator.
Write a professional LinkedIn post based on the provided notes.

Guidelines:
- Maximum 3000 characters
- Start with a hook (first 2 lines visible in feed)
- Use line breaks for readability
- Include relevant insights or data
- End with a question or CTA to drive engagement
- Use 3-5 relevant hashtags`,

  mastodon: `You are a concise social media writer.
Write a Mastodon post based on the provided notes.

Guidelines:
- Maximum 500 characters
- Be informative and community-friendly
- Use hashtags for discoverability (2-3)
- Provide value in a compact format`,

  bluesky: `You are a concise social media writer.
Write a Bluesky post based on the provided notes.

Guidelines:
- Maximum 300 characters
- Be engaging and conversational
- Focus on one key insight
- Keep it punchy and memorable`,

  devto: `You are an expert developer blogger.
Write a technical article in Markdown based on the provided notes.

Guidelines:
- Developer-focused content
- Include code examples with syntax highlighting
- Clear step-by-step explanations
- Add a TL;DR at the top
- Include relevant tags (up to 4)`,

  ghost: `You are an expert blog writer.
Write a well-crafted blog post in Markdown based on the provided notes.

Guidelines:
- Clear and engaging title
- Strong narrative structure
- Rich formatting with headings, lists, and quotes
- Include featured image suggestion
- SEO-friendly meta description`,

  default: `You are a skilled content writer.
Create well-written content based on the provided notes.

Guidelines:
- Adapt to the appropriate format and length
- Be clear, engaging, and informative
- Maintain a consistent voice throughout`,
}
