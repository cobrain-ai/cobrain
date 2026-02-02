import type { LLMProvider, Note, SearchResult } from '@cobrain/core'

export interface QueryRequest {
  query: string
  conversationId?: string
  filters?: {
    dateRange?: { start?: Date; end?: Date }
    entities?: string[]
  }
}

export interface QueryResponse {
  answer: string
  confidence: number
  sources: Array<{
    noteId: string
    relevance: number
    excerpt: string
  }>
  suggestedFollowups: string[]
  processingTime: number
}

export interface QueryContext {
  notes: Note[]
  query: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

const QUERY_SYSTEM_PROMPT = `You are CoBrain, an AI assistant that helps users retrieve and understand information from their personal notes.

Your capabilities:
- Search through the user's notes to find relevant information
- Understand temporal references (today, last week, next Tuesday)
- Recognize people, projects, and topics mentioned in notes
- Provide accurate answers based ONLY on the provided notes
- Cite specific notes when answering

Guidelines:
1. Answer based ONLY on the provided notes - don't make up information
2. If you can't find relevant information, say so clearly
3. Be concise but comprehensive
4. Reference specific notes when possible (e.g., "According to your note from [date]...")
5. If the query is ambiguous, ask for clarification
6. Suggest follow-up questions when appropriate

Response format:
- Start with a direct answer to the question
- Include relevant details from the notes
- End with 1-2 suggested follow-up questions if appropriate`

const INTENT_CLASSIFICATION_PROMPT = `Classify the user's query intent. Return a JSON object with:
- intent: "search" | "action" | "clarification" | "greeting"
- entities: array of entities mentioned (people, places, dates, projects)
- temporal: any time references (e.g., "today", "last week")
- confidence: 0-1

Query:`

export interface QueryIntent {
  intent: 'search' | 'action' | 'clarification' | 'greeting'
  entities: string[]
  temporal: string | null
  confidence: number
}

/**
 * Classify the intent of a user query
 */
export async function classifyIntent(
  query: string,
  provider: LLMProvider
): Promise<QueryIntent> {
  try {
    const result = await provider.complete([
      { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
      { role: 'user', content: query },
    ])

    const parsed = JSON.parse(result.content)
    return {
      intent: parsed.intent ?? 'search',
      entities: parsed.entities ?? [],
      temporal: parsed.temporal ?? null,
      confidence: parsed.confidence ?? 0.8,
    }
  } catch {
    // Default to search intent if classification fails
    return {
      intent: 'search',
      entities: [],
      temporal: null,
      confidence: 0.5,
    }
  }
}

/**
 * Build context string from notes for LLM
 */
function buildNotesContext(notes: Note[]): string {
  if (notes.length === 0) {
    return 'No relevant notes found.'
  }

  return notes
    .map((note, i) => {
      const date = note.createdAt.toLocaleDateString()
      return `[Note ${i + 1}] (${date})\n${note.content}`
    })
    .join('\n\n---\n\n')
}

/**
 * Generate suggested follow-up questions based on context
 */
function generateFollowups(query: string, notes: Note[]): string[] {
  const followups: string[] = []

  // Extract unique entity types from notes
  const hasDate = notes.some((n) => /tomorrow|today|meeting|deadline/i.test(n.content))
  const hasPerson = notes.some((n) => /[A-Z][a-z]+ [A-Z][a-z]+/.test(n.content))
  const hasProject = notes.some((n) => /project|task|todo/i.test(n.content))

  if (hasDate && !query.includes('when')) {
    followups.push('When are my upcoming deadlines?')
  }
  if (hasPerson && !query.includes('who')) {
    followups.push('Who should I follow up with?')
  }
  if (hasProject && !query.includes('project')) {
    followups.push('What are my active projects?')
  }

  return followups.slice(0, 2)
}

/**
 * Extract relevant excerpts from a note for a given query
 */
function extractExcerpt(note: Note, query: string, maxLength = 150): string {
  const queryWords = query.toLowerCase().split(/\s+/)
  const sentences = note.content.split(/[.!?]+/)

  // Find sentences containing query words
  const relevantSentences = sentences.filter((sentence) =>
    queryWords.some((word) => sentence.toLowerCase().includes(word))
  )

  if (relevantSentences.length > 0) {
    const excerpt = relevantSentences[0].trim()
    return excerpt.length > maxLength
      ? excerpt.substring(0, maxLength) + '...'
      : excerpt
  }

  // Fall back to first sentence
  const first = sentences[0]?.trim() ?? note.content.substring(0, maxLength)
  return first.length > maxLength ? first.substring(0, maxLength) + '...' : first
}

/**
 * Main query processing function
 */
export async function processQuery(
  request: QueryRequest,
  notes: Note[],
  provider: LLMProvider
): Promise<QueryResponse> {
  const startTime = Date.now()

  // Classify intent first
  const intent = await classifyIntent(request.query, provider)

  // Handle greeting
  if (intent.intent === 'greeting') {
    return {
      answer: "Hi! I'm your CoBrain assistant. Ask me anything about your notes!",
      confidence: 1.0,
      sources: [],
      suggestedFollowups: [
        'What do I need to do today?',
        'Show me my recent notes',
      ],
      processingTime: Date.now() - startTime,
    }
  }

  // Build context from notes
  const notesContext = buildNotesContext(notes)

  // Generate response
  const result = await provider.complete([
    { role: 'system', content: QUERY_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Here are the relevant notes:\n\n${notesContext}\n\nQuestion: ${request.query}`,
    },
  ])

  // Build sources from notes
  const sources = notes.slice(0, 5).map((note, i) => ({
    noteId: note.id,
    relevance: 1 - i * 0.1, // Decreasing relevance
    excerpt: extractExcerpt(note, request.query),
  }))

  return {
    answer: result.content,
    confidence: intent.confidence,
    sources,
    suggestedFollowups: generateFollowups(request.query, notes),
    processingTime: Date.now() - startTime,
  }
}

/**
 * Simple query for backward compatibility
 */
export async function answerQuery(
  context: QueryContext,
  provider: LLMProvider
): Promise<{ answer: string; sources: Note[]; confidence: number }> {
  const response = await processQuery(
    { query: context.query },
    context.notes,
    provider
  )

  return {
    answer: response.answer,
    sources: context.notes,
    confidence: response.confidence,
  }
}
