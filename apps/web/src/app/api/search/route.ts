import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

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

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
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

    // TODO: Implement actual search
    // 1. Get user's notes from database
    // const notes = await notesRepository.findByUser({ userId: session.user.id })
    // 2. Perform search based on mode
    // const results = await search({ query, limit, mode, filters }, notes, getEmbedding)

    // Mock response for now
    const mockResults = generateMockResults(query, limit)

    return NextResponse.json({
      results: mockResults,
      total: mockResults.length,
      query,
      mode,
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

function generateMockResults(query: string, limit: number) {
  // Generate mock results based on query
  const lowerQuery = query.toLowerCase()
  const results = []

  // Simulate finding relevant notes
  const mockNotes = [
    {
      id: '1',
      content: 'Meeting with John about the project proposal. Need to review budget.',
      date: '2026-02-03',
    },
    {
      id: '2',
      content: 'Ideas for the new feature: AI-powered organization, semantic search',
      date: '2026-02-02',
    },
    {
      id: '3',
      content: 'Remember to call Sarah about the team meeting tomorrow',
      date: '2026-02-01',
    },
  ]

  for (const note of mockNotes) {
    if (
      note.content.toLowerCase().includes(lowerQuery) ||
      lowerQuery.split(' ').some((word) =>
        note.content.toLowerCase().includes(word)
      )
    ) {
      results.push({
        noteId: note.id,
        relevance: 0.8 + Math.random() * 0.2,
        excerpt: note.content.substring(0, 100),
        highlights: [note.content.substring(0, 50)],
        matchType: 'hybrid',
        createdAt: note.date,
      })
    }
  }

  // If no matches, return some generic results
  if (results.length === 0) {
    results.push({
      noteId: '0',
      relevance: 0.5,
      excerpt: `No exact matches found for "${query}". Try different keywords.`,
      highlights: [],
      matchType: 'keyword',
      createdAt: new Date().toISOString().split('T')[0],
    })
  }

  return results.slice(0, limit)
}
