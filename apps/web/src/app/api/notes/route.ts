import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  source: z.enum(['text', 'voice', 'import']).optional().default('text'),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createNoteSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { content, source } = result.data

    // TODO: Save to database
    // const note = await notesRepository.create({
    //   content,
    //   source,
    //   userId: session.user.id,
    // })

    // TODO: Extract entities in background
    // await extractEntitiesQueue.add({ noteId: note.id, content })

    // Mock response for now
    const note = {
      id: crypto.randomUUID(),
      content,
      source,
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const search = searchParams.get('search') ?? undefined

    // TODO: Fetch from database
    // const notes = await notesRepository.findByUser({
    //   userId: session.user.id,
    //   limit,
    //   offset,
    //   search,
    // })

    // Mock response for now
    const notes: unknown[] = []

    return NextResponse.json({ notes, total: 0, limit, offset })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
