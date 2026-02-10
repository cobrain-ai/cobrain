// Content Pipeline
// Transforms markdown content to platform-specific formats

import type { RawContent, AdaptedContent, Platform } from './types.js'

/**
 * Content pipeline transforms raw markdown into platform-specific formats.
 */
export class ContentPipeline {
  /**
   * Convert markdown to HTML (for blog platforms)
   */
  static markdownToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    // In production, use unified/remark/rehype
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      // Images
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />')

    return `<p>${html}</p>`
  }

  /**
   * Convert markdown to plain text (for social platforms)
   */
  static markdownToPlainText(markdown: string): string {
    return markdown
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '')
      .replace(/^[-*+]\s+/gm, '- ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  /**
   * Split long content into thread parts for social platforms
   */
  static splitIntoThread(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) return [text]

    const parts: string[] = []
    const sentences = text.split(/(?<=[.!?])\s+/)
    let current = ''

    for (const sentence of sentences) {
      if (current.length + sentence.length + 1 > maxChars) {
        if (current) parts.push(current.trim())
        current = sentence
      } else {
        current += (current ? ' ' : '') + sentence
      }
    }
    if (current) parts.push(current.trim())

    return parts
  }

  /**
   * Generate excerpt from content
   */
  static generateExcerpt(text: string, maxLength: number = 160): string {
    const plain = ContentPipeline.markdownToPlainText(text)
    if (plain.length <= maxLength) return plain
    return plain.substring(0, maxLength - 3).replace(/\s+\S*$/, '') + '...'
  }

  /**
   * Adapt raw content for a specific platform
   */
  static adaptForPlatform(raw: RawContent, platform: Platform): AdaptedContent {
    const plainText = ContentPipeline.markdownToPlainText(raw.body)

    switch (platform) {
      // Blog platforms - use HTML
      case 'hashnode':
      case 'devto':
        return {
          title: raw.title,
          body: raw.body,
          format: 'markdown',
          tags: raw.tags,
          media: raw.media,
          excerpt: ContentPipeline.generateExcerpt(raw.body),
          seoMeta: {
            metaDescription: ContentPipeline.generateExcerpt(raw.body),
            keywords: raw.tags,
          },
        }

      case 'wordpress':
      case 'medium':
      case 'ghost':
        return {
          title: raw.title,
          body: ContentPipeline.markdownToHtml(raw.body),
          format: 'html',
          tags: raw.tags,
          media: raw.media,
          excerpt: ContentPipeline.generateExcerpt(raw.body),
        }

      // Thread-based social - split into parts
      case 'threads':
        return {
          body: plainText,
          format: 'plaintext',
          threadParts: ContentPipeline.splitIntoThread(plainText, 500),
          tags: raw.tags,
          media: raw.media,
        }

      case 'twitter':
        return {
          body: plainText,
          format: 'plaintext',
          threadParts: ContentPipeline.splitIntoThread(plainText, 280),
          tags: raw.tags,
          media: raw.media,
        }

      // Social - plain text with limits
      case 'linkedin':
        return {
          body: plainText.substring(0, 3000),
          format: 'plaintext',
          tags: raw.tags,
          media: raw.media,
        }

      case 'mastodon':
        return {
          body: plainText.substring(0, 500),
          format: 'plaintext',
          tags: raw.tags,
          media: raw.media,
        }

      case 'bluesky':
        return {
          body: plainText.substring(0, 300),
          format: 'plaintext',
          tags: raw.tags,
          media: raw.media,
        }

      default:
        return {
          body: plainText,
          format: 'plaintext',
          tags: raw.tags,
          media: raw.media,
        }
    }
  }
}
