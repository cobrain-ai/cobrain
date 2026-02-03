import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { notesRepository, embeddingsRepository } from '@cobrain/database'
import { processQuery } from '@cobrain/ai'
import { ProviderFactory, type LLMProvider } from '@cobrain/core'
import type { Note } from '@cobrain/core'

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
})

// Get LLM provider - defaults to Ollama for local-first approach
async function getProvider(): Promise<LLMProvider | null> {
  try {
    // Try Ollama first (local)
    const provider = ProviderFactory.ollama({ model: 'llama3:8b' })
    await provider.initialize()

    if (await provider.isAvailable()) {
      return provider
    }
  } catch {
    // Ollama not available, try other providers
  }

  // TODO: Add fallback to cloud providers if configured
  // Could check for API keys in environment and use OpenAI/Anthropic

  return null
}

// Convert database note to core Note type
function toNote(dbNote: {
  id: string
  content: string
  rawContent: string | null
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  isArchived: boolean
  source: string
}): Note {
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

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = chatSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, conversationId } = result.data
    const startTime = Date.now()

    // Get LLM provider
    const provider = await getProvider()

    if (!provider) {
      // Return helpful message when no AI provider available
      return NextResponse.json({
        answer: getNoProviderResponse(message),
        confidence: 1.0,
        sources: [],
        suggestedFollowups: [
          'How do I set up Ollama?',
          'What AI providers are supported?',
        ],
        processingTime: Date.now() - startTime,
        conversationId: conversationId ?? crypto.randomUUID(),
        providerStatus: 'unavailable',
      })
    }

    // Get user's notes for context
    let relevantNotes: Note[] = []

    try {
      // First try semantic search if embeddings exist
      const queryEmbedding = await getQueryEmbedding(message)

      if (queryEmbedding) {
        const similarNotes = await embeddingsRepository.findSimilar(
          queryEmbedding,
          session.user.id,
          { limit: 10, threshold: 0.5 }
        )
        const noteIds = similarNotes.map((n) => n.noteId)

        if (noteIds.length > 0) {
          const dbNotes = await notesRepository.findByIds(noteIds)
          relevantNotes = dbNotes.map(toNote)
        }
      }

      // If no semantic results, fall back to recent notes
      if (relevantNotes.length === 0) {
        const dbNotes = await notesRepository.findByUser({
          userId: session.user.id,
          limit: 20,
        })
        relevantNotes = dbNotes.map(toNote)
      }
    } catch (error) {
      console.error('Error fetching notes for context:', error)
      // Continue with empty context
    }

    // Process query with LLM
    try {
      const response = await processQuery(
        { query: message, conversationId },
        relevantNotes,
        provider
      )

      return NextResponse.json({
        ...response,
        conversationId: conversationId ?? crypto.randomUUID(),
        providerStatus: 'connected',
      })
    } catch (error) {
      console.error('LLM processing error:', error)

      // Return fallback response
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
        conversationId: conversationId ?? crypto.randomUUID(),
        providerStatus: 'error',
      })
    } finally {
      // Clean up provider
      await provider.dispose()
    }
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get embedding for query using Ollama
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

  const lowerMessage = message.toLowerCase()

  // Simple keyword matching fallback
  const relevantNotes = notes.filter((note) =>
    message
      .split(' ')
      .some((word) => word.length > 2 && note.content.toLowerCase().includes(word.toLowerCase()))
  )

  if (relevantNotes.length > 0) {
    return `I found ${relevantNotes.length} potentially relevant note(s). Here's what I found:\n\n${relevantNotes
      .slice(0, 3)
      .map((n, i) => `${i + 1}. ${n.content.substring(0, 100)}...`)
      .join('\n\n')}\n\nNote: AI processing encountered an issue. This is a basic keyword match.`
  }

  return `I have ${notes.length} notes but couldn't find specific matches for your query. Try asking about:\n- Your recent captures\n- Specific people or projects you've mentioned\n- Tasks or reminders`
}
