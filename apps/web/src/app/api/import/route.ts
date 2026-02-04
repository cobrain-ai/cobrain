import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notesRepository } from '@cobrain/database'

interface ImportedNote {
  content: string
  source: string
  metadata?: {
    title?: string
    tags?: string[]
    createdAt?: string
    path?: string
  }
}

/**
 * POST /api/import
 * Import notes from various formats (Markdown, Obsidian, Notion)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const format = formData.get('format') as string || 'markdown'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = {
      total: files.length,
      imported: 0,
      failed: 0,
      notes: [] as { id: string; title: string }[],
      errors: [] as { file: string; error: string }[],
    }

    for (const file of files) {
      try {
        const content = await file.text()
        let parsedNotes: ImportedNote[] = []

        // Parse based on format
        switch (format) {
          case 'obsidian':
            parsedNotes = parseObsidianFile(content, file.name)
            break
          case 'notion':
            parsedNotes = parseNotionFile(content, file.name)
            break
          case 'markdown':
          default:
            parsedNotes = parseMarkdownFile(content, file.name)
            break
        }

        // Create notes in database
        for (const parsedNote of parsedNotes) {
          const note = await notesRepository.create({
            userId: session.user.id,
            content: parsedNote.content,
            source: 'import',
          })

          results.notes.push({
            id: note.id,
            title: parsedNote.metadata?.title || file.name,
          })
          results.imported++
        }
      } catch (error) {
        results.errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        results.failed++
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Parse a standard Markdown file
 */
function parseMarkdownFile(content: string, filename: string): ImportedNote[] {
  // Extract title from first heading or filename
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : filename.replace(/\.md$/, '')

  return [{
    content,
    source: 'markdown',
    metadata: {
      title,
      path: filename,
    },
  }]
}

/**
 * Parse an Obsidian markdown file
 * Handles frontmatter, wikilinks [[]], tags #tag
 */
function parseObsidianFile(content: string, filename: string): ImportedNote[] {
  let processedContent = content
  const metadata: ImportedNote['metadata'] = {
    path: filename,
  }

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    processedContent = content.slice(frontmatterMatch[0].length)

    // Parse simple YAML
    const titleMatch = frontmatter.match(/title:\s*["']?(.+?)["']?\s*$/m)
    if (titleMatch) metadata.title = titleMatch[1]

    const tagsMatch = frontmatter.match(/tags:\s*\[(.+?)\]/)
    if (tagsMatch) {
      metadata.tags = tagsMatch[1].split(',').map((t) => t.trim().replace(/["']/g, ''))
    }

    const dateMatch = frontmatter.match(/(?:date|created):\s*(.+)$/m)
    if (dateMatch) metadata.createdAt = dateMatch[1].trim()
  }

  // Convert wikilinks [[Link]] to regular text (preserve for entity extraction)
  processedContent = processedContent.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, alias) => {
    return alias || link
  })

  // Extract title from first heading if not in frontmatter
  if (!metadata.title) {
    const titleMatch = processedContent.match(/^#\s+(.+)$/m)
    metadata.title = titleMatch ? titleMatch[1] : filename.replace(/\.md$/, '')
  }

  return [{
    content: processedContent,
    source: 'obsidian',
    metadata,
  }]
}

/**
 * Parse Notion export (HTML or Markdown)
 */
function parseNotionFile(content: string, filename: string): ImportedNote[] {
  let processedContent = content
  const metadata: ImportedNote['metadata'] = {
    path: filename,
  }

  // Handle HTML export
  if (filename.endsWith('.html')) {
    // Basic HTML to text conversion
    processedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '- ')
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Try to extract title from Notion page title
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i)
    metadata.title = titleMatch ? titleMatch[1].replace(' - Notion', '').trim() : filename.replace(/\.html$/, '')
  } else {
    // Markdown export
    const titleMatch = processedContent.match(/^#\s+(.+)$/m)
    metadata.title = titleMatch ? titleMatch[1] : filename.replace(/\.md$/, '')
  }

  return [{
    content: processedContent,
    source: 'notion',
    metadata,
  }]
}
