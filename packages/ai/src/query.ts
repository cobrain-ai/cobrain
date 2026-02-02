import { cosineSimilarity } from '@cobrain/core'
import type { LLMProvider, Note, SearchResult } from '@cobrain/core'

export interface QueryContext {
  notes: Note[]
  query: string
}

export interface QueryResult {
  answer: string
  sources: Note[]
  confidence: number
}

const QUERY_SYSTEM_PROMPT = `You are CoBrain, an AI assistant that helps users retrieve information from their notes.
You have access to the user's notes and should answer questions based on them.

Guidelines:
- Answer based only on the provided notes
- If the information isn't in the notes, say so
- Be concise but comprehensive
- Reference specific notes when possible
- If asked about reminders or commitments, check the relevant notes

Notes context will be provided in the user message.`

export async function answerQuery(
  context: QueryContext,
  provider: LLMProvider
): Promise<QueryResult> {
  const notesContext = context.notes
    .map(
      (note, i) =>
        `[Note ${i + 1}] (${note.createdAt.toLocaleDateString()})\n${note.content}`
    )
    .join('\n\n---\n\n')

  const result = await provider.complete([
    {
      role: 'system',
      content: QUERY_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Here are the relevant notes:\n\n${notesContext}\n\nQuestion: ${context.query}`,
    },
  ])

  return {
    answer: result.content,
    sources: context.notes,
    confidence: 0.8, // TODO: Implement confidence scoring
  }
}

export interface SemanticSearchOptions {
  limit?: number
  threshold?: number
}

export async function semanticSearch(
  query: string,
  allNotes: Note[],
  getEmbedding: (text: string) => Promise<number[]>,
  options: SemanticSearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.5 } = options

  // Get query embedding
  const queryEmbedding = await getEmbedding(query)

  // Calculate similarity scores for all notes with embeddings
  const scored = allNotes
    .filter((note) => note.embedding && note.embedding.length > 0)
    .map((note) => ({
      note,
      score: cosineSimilarity(queryEmbedding, note.embedding!),
    }))
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map(({ note, score }) => ({
    note,
    score,
    highlights: extractHighlights(note.content, query),
  }))
}

function extractHighlights(content: string, query: string): string[] {
  const words = query.toLowerCase().split(/\s+/)
  const sentences = content.split(/[.!?]+/)

  return sentences
    .filter((sentence) =>
      words.some((word) => sentence.toLowerCase().includes(word))
    )
    .slice(0, 3)
    .map((s) => s.trim())
}
