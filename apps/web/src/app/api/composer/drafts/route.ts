import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { composerDraftsRepository, draftContentRepository } from '@cobrain/database'

const createDraftSchema = z.object({
  title: z.string().optional(),
  sourceNoteIds: z.array(z.string()).optional(),
  contents: z
    .array(
      z.object({
        platform: z.string(),
        content: z.string(),
        format: z.string().optional(),
      })
    )
    .optional(),
})

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const drafts = await composerDraftsRepository.findByUser(session.user.id)

  // Fetch content for each draft
  const draftsWithContent = await Promise.all(
    drafts.map(async (draft) => {
      const content = await draftContentRepository.findByDraft(draft.id)
      return { ...draft, content }
    })
  )

  return NextResponse.json({ drafts: draftsWithContent })
}

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

  const result = createDraftSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { title, sourceNoteIds, contents } = result.data

  const draft = await composerDraftsRepository.create({
    userId: session.user.id,
    title,
    sourceNoteIds,
  })

  // Save per-platform content if provided
  if (contents?.length) {
    for (const c of contents) {
      await draftContentRepository.create({
        draftId: draft.id,
        platform: c.platform as any,
        content: c.content,
        format: c.format,
      })
    }
  }

  const draftContents = await draftContentRepository.findByDraft(draft.id)

  return NextResponse.json({ draft: { ...draft, content: draftContents } }, { status: 201 })
}
