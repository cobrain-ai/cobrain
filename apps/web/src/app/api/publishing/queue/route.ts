import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { publishedPostsRepository } from '@cobrain/database'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const posts = await publishedPostsRepository.findByUser(session.user.id)

  return NextResponse.json({ posts })
}
