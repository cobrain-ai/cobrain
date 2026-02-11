import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  publishedPostsRepository,
  publishQueueRepository,
} from '@cobrain/database'

const retrySchema = z.object({
  postId: z.string().min(1),
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

  const result = retrySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { postId } = result.data

  // Verify post belongs to user
  const post = await publishedPostsRepository.findById(postId)
  if (!post || post.userId !== session.user.id) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (post.status !== 'failed') {
    return NextResponse.json({ error: 'Can only retry failed posts' }, { status: 400 })
  }

  // Reset status to queued and re-enqueue
  await publishedPostsRepository.updateStatus(postId, 'queued')
  await publishQueueRepository.enqueue(postId)

  return NextResponse.json({ success: true })
}
