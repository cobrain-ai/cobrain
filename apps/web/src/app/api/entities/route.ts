import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { entitiesRepository } from '@cobrain/database'
import type { EntityType, RelationType } from '@cobrain/core'

const entityTypes: EntityType[] = [
  'person',
  'place',
  'organization',
  'event',
  'concept',
  'date',
  'time',
  'task',
  'project',
  'tag',
  'custom',
]

const relationTypes: RelationType[] = [
  'mentions',
  'related_to',
  'part_of',
  'depends_on',
  'created_by',
  'assigned_to',
  'scheduled_for',
  'tagged_with',
  'similar_to',
  'custom',
]

const createEntitySchema = z.object({
  type: z.enum(entityTypes as [EntityType, ...EntityType[]]),
  name: z.string().min(1, 'Name is required'),
  metadata: z.record(z.unknown()).optional(),
})

const createRelationSchema = z.object({
  fromId: z.string().min(1),
  toId: z.string().min(1),
  type: z.enum(relationTypes as [RelationType, ...RelationType[]]),
  weight: z.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as EntityType | null
    const name = searchParams.get('name')
    const noteId = searchParams.get('noteId')

    if (noteId) {
      const entities = await entitiesRepository.findByNote(noteId)
      return NextResponse.json({ entities })
    }

    if (type) {
      const entities = await entitiesRepository.findByType(type)
      return NextResponse.json({ entities })
    }

    if (name) {
      const entities = await entitiesRepository.findByName(name)
      return NextResponse.json({ entities })
    }

    return NextResponse.json(
      { error: 'Provide type, name, or noteId parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Get entities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action = 'create' } = body

    switch (action) {
      case 'create': {
        const result = createEntitySchema.safeParse(body)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error.errors[0].message },
            { status: 400 }
          )
        }

        const entity = await entitiesRepository.create(result.data)
        return NextResponse.json({ entity }, { status: 201 })
      }

      case 'link': {
        const { noteId, entityId, confidence, startIndex, endIndex } = body
        if (!noteId || !entityId) {
          return NextResponse.json(
            { error: 'noteId and entityId are required' },
            { status: 400 }
          )
        }

        await entitiesRepository.linkToNote({
          noteId,
          entityId,
          confidence,
          startIndex,
          endIndex,
        })
        return NextResponse.json({ success: true })
      }

      case 'unlink': {
        const { noteId, entityId } = body
        if (!noteId || !entityId) {
          return NextResponse.json(
            { error: 'noteId and entityId are required' },
            { status: 400 }
          )
        }

        await entitiesRepository.unlinkFromNote(noteId, entityId)
        return NextResponse.json({ success: true })
      }

      case 'relate': {
        const result = createRelationSchema.safeParse(body)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error.errors[0].message },
            { status: 400 }
          )
        }

        const relation = await entitiesRepository.createRelation(result.data)
        return NextResponse.json({ relation }, { status: 201 })
      }

      case 'unrelate': {
        const { relationId } = body
        if (!relationId) {
          return NextResponse.json(
            { error: 'relationId is required' },
            { status: 400 }
          )
        }

        await entitiesRepository.deleteRelation(relationId)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Entities API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('id')

    if (!entityId) {
      return NextResponse.json(
        { error: 'Entity id is required' },
        { status: 400 }
      )
    }

    await entitiesRepository.delete(entityId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete entity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
