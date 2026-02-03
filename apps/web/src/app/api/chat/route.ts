import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { notesRepository, embeddingsRepository } from '@cobrain/database'
import { processQuery } from '@cobrain/ai'
import type { LLMProvider, Note } from '@cobrain/core'
import { providerConfigStore } from '@/lib/provider-config-store'
import { createProvider } from '@/lib/providers'
import type { ProviderConfig } from '@/lib/providers'

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parseResult = await parseRequestBody(request)
  if ('error' in parseResult) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 })
  }

  const { message, conversationId } = parseResult
  const startTime = Date.now()
  const newConversationId = conversationId ?? crypto.randomUUID()

  const provider = await getProviderForUser(session.user.id)

  if (!provider) {
    return NextResponse.json({
      answer: getNoProviderResponse(message),
      confidence: 1.0,
      sources: [],
      suggestedFollowups: [
        'How do I set up Ollama?',
        'What AI providers are supported?',
      ],
      processingTime: Date.now() - startTime,
      conversationId: newConversationId,
      providerStatus: 'unavailable',
    })
  }

  const relevantNotes = await fetchRelevantNotes(session.user.id, message)

  try {
    const response = await processQuery(
      { query: message, conversationId },
      relevantNotes,
      provider
    )

    return NextResponse.json({
      ...response,
      conversationId: newConversationId,
      providerStatus: 'connected',
    })
  } catch (error) {
    console.error('LLM processing error:', error)

    return NextResponse.json({
      answer: getFallbackResponse(message, relevantNotes),
      confidence: 0.5,
      sources: relevantNotes.slice(0, 3).map((note, i) => ({
        noteId: note.id,
        relevance: 1 - i * 0.1,
        excerpt: note.content.substring(0, 150),
      })),
      suggestedFollowups: [
        'Tell me more about my recent notes',
        'What tasks do I have?',
      ],
      processingTime: Date.now() - startTime,
      conversationId: newConversationId,
      providerStatus: 'error',
    })
  } finally {
    await provider.dispose()
  }
}

async function parseRequestBody(
  request: Request
): Promise<z.infer<typeof chatSchema> | { error: string }> {
  try {
    const body = await request.json()
    const result = chatSchema.safeParse(body)

    if (!result.success) {
      return { error: result.error.errors[0].message }
    }

    return result.data
  } catch {
    return { error: 'Invalid JSON body' }
  }
}

async function getProviderForUser(userId: string): Promise<LLMProvider | null> {
  const userConfig = providerConfigStore.get(userId)
  const activeConfig = getActiveProviderConfig(userConfig)

  const provider = createProvider({
    type: activeConfig.type,
    config: activeConfig,
  })

  if (provider) {
    const initialized = await initializeProvider(provider)
    if (initialized) return provider
  }

  // Fallback to Ollama
  const fallbackProvider = createProvider({ type: 'ollama' })
  if (fallbackProvider) {
    const initialized = await initializeProvider(fallbackProvider)
    if (initialized) return fallbackProvider
  }

  return null
}

function getActiveProviderConfig(
  userConfig: ReturnType<typeof providerConfigStore.get>
): ProviderConfig {
  const activeConfig = userConfig.configs[userConfig.activeProvider]

  if (activeConfig?.enabled) {
    return activeConfig
  }

  // Fall back to Ollama if active provider is not enabled
  return userConfig.configs.ollama
}

async function initializeProvider(provider: LLMProvider): Promise<boolean> {
  try {
    await provider.initialize()
    if (await provider.isAvailable()) {
      return true
    }
    await provider.dispose()
    return false
  } catch (error) {
    console.error('Provider initialization error:', error)
    try {
      await provider.dispose()
    } catch {
      // Ignore disposal errors
    }
    return false
  }
}

async function fetchRelevantNotes(userId: string, query: string): Promise<Note[]> {
  try {
    // First try semantic search if embeddings exist
    const queryEmbedding = await getQueryEmbedding(query)

    if (queryEmbedding) {
      const similarNotes = await embeddingsRepository.findSimilar(
        queryEmbedding,
        userId,
        { limit: 10, threshold: 0.5 }
      )

      if (similarNotes.length > 0) {
        const noteIds = similarNotes.map((n) => n.noteId)
        const dbNotes = await notesRepository.findByIds(noteIds)
        return dbNotes.map(toNote)
      }
    }

    // Fall back to recent notes
    const dbNotes = await notesRepository.findByUser({
      userId,
      limit: 20,
    })
    return dbNotes.map(toNote)
  } catch (error) {
    console.error('Error fetching notes for context:', error)
    return []
  }
}

async function getQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: query,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.embedding as number[]
  } catch {
    return null
  }
}

interface DatabaseNote {
  id: string
  content: string
  rawContent: string | null
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  isArchived: boolean
  source: string
}

function toNote(dbNote: DatabaseNote): Note {
  return {
    id: dbNote.id,
    content: dbNote.content,
    rawContent: dbNote.rawContent ?? undefined,
    entities: [],
    createdAt: dbNote.createdAt,
    updatedAt: dbNote.updatedAt,
    metadata: {
      source: dbNote.source as 'text' | 'voice' | 'import',
      isPinned: dbNote.isPinned,
      isArchived: dbNote.isArchived,
    },
  }
}

function getNoProviderResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your CoBrain assistant. To enable AI-powered conversations, please install and start Ollama (ollama.com) with the llama3:8b model. Once running, I'll be able to search through your notes and answer questions intelligently."
  }

  if (lowerMessage.includes('ollama') || lowerMessage.includes('setup')) {
    return `To set up local AI:
1. Install Ollama from ollama.com
2. Run: ollama pull llama3:8b
3. Run: ollama pull nomic-embed-text
4. Ollama should start automatically

Once running, refresh this page and I'll be ready to help with your notes!`
  }

  return `I'm currently offline because no AI provider is available. To enable AI features:

1. **Local AI (Free):** Install Ollama and pull the llama3:8b model
2. **Cloud AI (Coming soon):** Configure OpenAI or Anthropic API keys

You can still capture notes and they'll be searchable once AI is connected!`
}

function getFallbackResponse(message: string, notes: Note[]): string {
  if (notes.length === 0) {
    return "I couldn't find any relevant notes. Try capturing some notes first, and I'll be able to search through them to answer your questions."
  }

  // Simple keyword matching fallback
  const keywords = message.split(' ').filter((word) => word.length > 2)
  const relevantNotes = notes.filter((note) =>
    keywords.some((word) => note.content.toLowerCase().includes(word.toLowerCase()))
  )

  if (relevantNotes.length > 0) {
    const excerpts = relevantNotes
      .slice(0, 3)
      .map((n, i) => `${i + 1}. ${n.content.substring(0, 100)}...`)
      .join('\n\n')

    return `I found ${relevantNotes.length} potentially relevant note(s). Here's what I found:\n\n${excerpts}\n\nNote: AI processing encountered an issue. This is a basic keyword match.`
  }

  return `I have ${notes.length} notes but couldn't find specific matches for your query. Try asking about:\n- Your recent captures\n- Specific people or projects you've mentioned\n- Tasks or reminders`
}
