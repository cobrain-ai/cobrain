import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { notesRepository, embeddingsRepository } from '@cobrain/database'
import { search as semanticSearch, keywordSearch } from '@cobrain/ai'

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(100).optional().default(10),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).optional().default('hybrid'),
  filters: z
    .object({
      dateRange: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
      entities: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
})

// Get embedding for query using Ollama
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding error: ${response.status}`)
  }

  const data = await response.json()
  return data.embedding as number[]
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = searchSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { query, limit, mode, filters } = result.data
    const startTime = Date.now()

    // Get user's notes
    const dbNotes = await notesRepository.findByUser({
      userId: session.user.id,
      limit: 100, // Get more notes for search filtering
      includeArchived: false,
    })

    if (dbNotes.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        query,
        mode,
        processingTime: Date.now() - startTime,
      })
    }

    const notes = dbNotes

    // Apply date filters if provided
    let filteredNotes = notes
    if (filters?.dateRange) {
      const { start, end } = filters.dateRange
      filteredNotes = notes.filter((note) => {
        if (start && note.createdAt < new Date(start)) return false
        if (end && note.createdAt > new Date(end)) return false
        return true
      })
    }

    // Try semantic search first
    let searchResults

    if (mode === 'keyword') {
      // Keyword only
      searchResults = keywordSearch(query, filteredNotes, { maxResults: limit })
    } else {
      // Try semantic or hybrid
      try {
        // Check if we have embeddings
        const queryEmbedding = await getEmbedding(query)

        // Load embeddings for notes
        const noteIds = filteredNotes.map((n) => n.id)
        const embeddings = await embeddingsRepository.findByNoteIds(noteIds)

        // Attach embeddings to notes
        const embeddingMap = new Map(embeddings.map((e) => [e.noteId, e.vector]))
        const notesWithEmbeddings = filteredNotes.map((note) => ({
          ...note,
          embedding: embeddingMap.get(note.id)
            ? deserializeEmbedding(embeddingMap.get(note.id)!)
            : undefined,
        }))

        const searchFilters = filters
          ? {
              ...filters,
              dateRange: filters.dateRange
                ? {
                    start: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
                    end: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined,
                  }
                : undefined,
            }
          : undefined

        searchResults = await semanticSearch(
          { query, limit, mode, filters: searchFilters },
          notesWithEmbeddings,
          async () => queryEmbedding
        )
      } catch (error) {
        console.log('Semantic search unavailable, falling back to keyword:', error)
        // Fall back to keyword search
        searchResults = keywordSearch(query, filteredNotes, { maxResults: limit })
      }
    }

    // Enrich results with note details
    const enrichedResults = searchResults.map((result) => {
      const note = filteredNotes.find((n) => n.id === result.noteId)
      return {
        ...result,
        createdAt: note?.createdAt.toISOString(),
        isPinned: note?.metadata?.isPinned,
      }
    })

    return NextResponse.json({
      results: enrichedResults,
      total: enrichedResults.length,
      query,
      mode: searchResults[0]?.matchType ?? mode,
      processingTime: Date.now() - startTime,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Deserialize embedding from Buffer to number array
function deserializeEmbedding(buffer: Buffer): number[] {
  const floats = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)
  return Array.from(floats)
}
