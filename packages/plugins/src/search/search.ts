// Search Logic
// Moved from @cobrain/ai for plugin architecture

import { cosineSimilarity } from '@cobrain/core'
import type { Note, SearchResult as CoreSearchResult } from '@cobrain/core'

export interface SearchRequest {
  query: string
  limit?: number
  filters?: {
    dateRange?: { start?: Date; end?: Date }
    entities?: string[]
    tags?: string[]
  }
  mode?: 'semantic' | 'keyword' | 'hybrid'
}

export interface SearchResult {
  noteId: string
  relevance: number
  excerpt: string
  highlights: string[]
  matchType: 'semantic' | 'keyword' | 'both'
}

export interface SearchOptions {
  semanticThreshold?: number
  keywordBoost?: number
  maxResults?: number
}

/**
 * Extract keyword matches from content
 */
function findKeywordMatches(content: string, query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
  const matches: string[] = []

  for (const word of words) {
    if (content.toLowerCase().includes(word)) {
      matches.push(word)
    }
  }

  return matches
}

/**
 * Extract a relevant excerpt from content based on query
 */
function extractExcerpt(content: string, query: string, maxLength = 200): string {
  const queryWords = query.toLowerCase().split(/\s+/)
  const sentences = content.split(/[.!?]+/)

  // Find sentence with most query word matches
  let bestSentence = sentences[0] ?? content.substring(0, maxLength)
  let bestScore = 0

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()
    const score = queryWords.filter((w) => lowerSentence.includes(w)).length
    if (score > bestScore) {
      bestScore = score
      bestSentence = sentence
    }
  }

  const trimmed = bestSentence.trim()
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed
}

/**
 * Extract highlight snippets containing query terms
 */
function extractHighlights(content: string, query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
  const sentences = content.split(/[.!?]+/)

  return sentences
    .filter((sentence) => words.some((word) => sentence.toLowerCase().includes(word)))
    .slice(0, 3)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Perform keyword-only search
 */
export function keywordSearch(
  query: string,
  notes: Note[],
  options: SearchOptions = {}
): SearchResult[] {
  const { maxResults = 10 } = options
  const results: SearchResult[] = []

  for (const note of notes) {
    const matches = findKeywordMatches(note.content, query)
    if (matches.length > 0) {
      results.push({
        noteId: note.id,
        relevance: matches.length / query.split(/\s+/).length,
        excerpt: extractExcerpt(note.content, query),
        highlights: extractHighlights(note.content, query),
        matchType: 'keyword',
      })
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults)
}

/**
 * Perform semantic search using embeddings
 */
export async function semanticSearch(
  query: string,
  notes: Note[],
  getEmbedding: (text: string) => Promise<number[]>,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { semanticThreshold = 0.5, maxResults = 10 } = options

  // Get query embedding
  const queryEmbedding = await getEmbedding(query)

  // Filter notes that have embeddings
  const notesWithEmbeddings = notes.filter((note) => note.embedding && note.embedding.length > 0)

  // Calculate similarity scores
  const scored = notesWithEmbeddings
    .map((note) => ({
      note,
      score: cosineSimilarity(queryEmbedding, note.embedding!),
    }))
    .filter((result) => result.score >= semanticThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)

  return scored.map(({ note, score }) => ({
    noteId: note.id,
    relevance: score,
    excerpt: extractExcerpt(note.content, query),
    highlights: extractHighlights(note.content, query),
    matchType: 'semantic',
  }))
}

/**
 * Perform hybrid search combining semantic and keyword matching
 */
export async function hybridSearch(
  query: string,
  notes: Note[],
  getEmbedding: (text: string) => Promise<number[]>,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { keywordBoost = 0.3, maxResults = 10 } = options

  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, notes, getEmbedding, options),
    Promise.resolve(keywordSearch(query, notes, options)),
  ])

  // Merge results
  const resultMap = new Map<string, SearchResult>()

  // Add semantic results
  for (const result of semanticResults) {
    resultMap.set(result.noteId, result)
  }

  // Merge keyword results, boosting if both match
  for (const result of keywordResults) {
    const existing = resultMap.get(result.noteId)
    if (existing) {
      // Both semantic and keyword match - boost relevance
      existing.relevance = Math.min(1.0, existing.relevance + keywordBoost)
      existing.matchType = 'both'
      existing.highlights = [...new Set([...existing.highlights, ...result.highlights])].slice(0, 5)
    } else {
      resultMap.set(result.noteId, result)
    }
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults)
}

/**
 * Main search function that handles all modes
 */
export async function search(
  request: SearchRequest,
  notes: Note[],
  getEmbedding?: (text: string) => Promise<number[]>
): Promise<SearchResult[]> {
  const { mode = 'hybrid', limit = 10, filters } = request
  let filteredNotes = notes

  // Apply filters
  if (filters) {
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filteredNotes = filteredNotes.filter((note) => {
        const noteDate = note.createdAt
        if (start && noteDate < start) return false
        if (end && noteDate > end) return false
        return true
      })
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredNotes = filteredNotes.filter((note) =>
        filters.tags!.some((tag) => note.metadata?.tags?.includes(tag))
      )
    }
  }

  const options: SearchOptions = { maxResults: limit }

  switch (mode) {
    case 'keyword':
      return keywordSearch(request.query, filteredNotes, options)

    case 'semantic':
      if (!getEmbedding) {
        throw new Error('Semantic search requires embedding function')
      }
      return semanticSearch(request.query, filteredNotes, getEmbedding, options)

    case 'hybrid':
    default:
      if (!getEmbedding) {
        // Fall back to keyword search if no embedding function
        return keywordSearch(request.query, filteredNotes, options)
      }
      return hybridSearch(request.query, filteredNotes, getEmbedding, options)
  }
}

/**
 * Convert to core SearchResult type for compatibility
 */
export function toCoreSearchResults(
  results: SearchResult[],
  notesMap: Map<string, Note>
): CoreSearchResult[] {
  return results
    .map((result): CoreSearchResult | null => {
      const note = notesMap.get(result.noteId)
      if (!note) return null
      return {
        note,
        score: result.relevance,
        highlights: result.highlights,
      }
    })
    .filter((r): r is CoreSearchResult => r !== null)
}
