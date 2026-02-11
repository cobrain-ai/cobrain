import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  publishingAccountsRepository,
  publishedPostsRepository,
  publishQueueRepository,
  composerDraftsRepository,
  draftContentRepository,
} from '@cobrain/database'

const publishSchema = z.object({
  draftId: z.string().optional(),
  draftContentId: z.string().optional(),
  platform: z.string(),
  accountId: z.string(),
  content: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = publishSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { platform, accountId, content, scheduledFor } = result.data
  let { draftId, draftContentId } = result.data

  // Verify account belongs to user
  const account = await publishingAccountsRepository.findById(accountId)
  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Publishing account not found' }, { status: 404 })
  }

  // If no draft exists, create one to store the content for the queue processor
  if (!draftContentId) {
    if (!draftId) {
      const draft = await composerDraftsRepository.create({
        userId: session.user.id,
        title: `Publish to ${platform}`,
      })
      draftId = draft.id
    }

    const dc = await draftContentRepository.create({
      draftId,
      platform: platform as any,
      content,
    })
    draftContentId = dc.id
  }

  // Create published post record
  const post = await publishedPostsRepository.create({
    draftId,
    draftContentId,
    userId: session.user.id,
    platform: platform as any,
    accountId,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
  })

  // Enqueue for publishing
  await publishQueueRepository.enqueue(
    post.id,
    scheduledFor ? new Date(scheduledFor) : undefined
  )

  return NextResponse.json({ post }, { status: 201 })
}
