import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
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

    // TODO: Implement actual query processing
    // 1. Get relevant notes using semantic search
    // const notes = await embeddingsRepository.findSimilar(queryEmbedding, session.user.id)
    // 2. Process query with LLM
    // const response = await processQuery({ query: message, conversationId }, notes, provider)

    // Mock response for now
    const startTime = Date.now()

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const response = {
      answer: generateMockResponse(message),
      confidence: 0.85,
      sources: [] as Array<{ noteId: string; relevance: number; excerpt: string }>,
      suggestedFollowups: [
        'What else would you like to know?',
        'Show me my recent notes',
      ],
      processingTime: Date.now() - startTime,
      conversationId: conversationId ?? crypto.randomUUID(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your CoBrain assistant. I can help you search through your notes, find information, and answer questions about what you've captured. What would you like to know?"
  }

  if (lowerMessage.includes('today') || lowerMessage.includes('todo')) {
    return "I don't have any notes with tasks for today yet. Once you start capturing notes with reminders and tasks, I'll be able to help you find them. Try typing something like 'Remind me to call John tomorrow at 2pm' in the Capture page!"
  }

  if (lowerMessage.includes('meeting') || lowerMessage.includes('schedule')) {
    return "I couldn't find any meetings in your notes. As you capture notes about meetings and appointments, I'll be able to help you track them. The AI will automatically extract dates and times from your notes."
  }

  if (lowerMessage.includes('project')) {
    return "No projects found in your notes yet. When you mention projects in your captures, CoBrain will automatically recognize and track them as entities, making it easy to find related information later."
  }

  return `I'm still learning about your notes! Once the AI processing is fully connected, I'll be able to search through your captured thoughts and provide relevant answers. You asked about: "${message}"\n\nIn the meantime, try capturing some notes with the Capture feature!`
}
