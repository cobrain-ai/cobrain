import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { graphRepository } from '@cobrain/database'

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') ?? 'stats'

    switch (action) {
      case 'stats': {
        const stats = await graphRepository.getStats()
        return NextResponse.json({ stats })
      }

      case 'hubs': {
        const limit = parseInt(searchParams.get('limit') ?? '10', 10)
        const hubs = await graphRepository.getHubs(limit)
        return NextResponse.json({ hubs })
      }

      case 'node': {
        const entityId = searchParams.get('entityId')
        if (!entityId) {
          return NextResponse.json(
            { error: 'entityId is required' },
            { status: 400 }
          )
        }
        const node = await graphRepository.getNode(entityId)
        if (!node) {
          return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
        }
        return NextResponse.json({ node })
      }

      case 'neighborhood': {
        const entityId = searchParams.get('entityId')
        if (!entityId) {
          return NextResponse.json(
            { error: 'entityId is required' },
            { status: 400 }
          )
        }
        const maxDepth = parseInt(searchParams.get('maxDepth') ?? '1', 10)
        const neighborhood = await graphRepository.getNeighborhood(entityId, {
          maxDepth,
        })
        if (!neighborhood) {
          return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
        }
        return NextResponse.json({ neighborhood })
      }

      case 'path': {
        const fromId = searchParams.get('fromId')
        const toId = searchParams.get('toId')
        if (!fromId || !toId) {
          return NextResponse.json(
            { error: 'fromId and toId are required' },
            { status: 400 }
          )
        }
        const maxDepth = parseInt(searchParams.get('maxDepth') ?? '6', 10)
        const path = await graphRepository.findPath(fromId, toId, { maxDepth })
        return NextResponse.json({ path })
      }

      case 'cooccurring': {
        const entityId = searchParams.get('entityId')
        if (!entityId) {
          return NextResponse.json(
            { error: 'entityId is required' },
            { status: 400 }
          )
        }
        const limit = parseInt(searchParams.get('limit') ?? '20', 10)
        const coOccurring = await graphRepository.findCoOccurring(entityId, {
          limit,
        })
        return NextResponse.json({ coOccurring })
      }

      case 'suggestions': {
        const minOccurrences = parseInt(
          searchParams.get('minOccurrences') ?? '3',
          10
        )
        const suggestions = await graphRepository.suggestRelations(minOccurrences)
        return NextResponse.json({ suggestions })
      }

      case 'context': {
        const noteId = searchParams.get('noteId')
        if (!noteId) {
          return NextResponse.json(
            { error: 'noteId is required' },
            { status: 400 }
          )
        }
        const maxDepth = parseInt(searchParams.get('maxDepth') ?? '2', 10)
        const context = await graphRepository.getNotesGraphContext(noteId, {
          maxDepth,
        })
        return NextResponse.json({ context })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Graph API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
