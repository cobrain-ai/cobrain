import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { composerDraftsRepository, draftContentRepository } from '@cobrain/database'

const updateDraftSchema = z.object({
  title: z.string().optional(),
  sourceNoteIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'generating', 'ready', 'published', 'failed']).optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const draft = await composerDraftsRepository.findById(id)
  if (!draft || draft.userId !== session.user.id) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  const content = await draftContentRepository.findByDraft(id)
  return NextResponse.json({ draft: { ...draft, content } })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const draft = await composerDraftsRepository.findById(id)
  if (!draft || draft.userId !== session.user.id) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = updateDraftSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const { title, sourceNoteIds, status, contents } = result.data

  const updated = await composerDraftsRepository.update(id, {
    title,
    sourceNoteIds,
    status,
  })

  // Replace per-platform content if provided
  if (contents) {
    await draftContentRepository.deleteByDraft(id)
    for (const c of contents) {
      await draftContentRepository.create({
        draftId: id,
        platform: c.platform as any,
        content: c.content,
        format: c.format,
      })
    }
  }

  const updatedContent = await draftContentRepository.findByDraft(id)
  return NextResponse.json({ draft: { ...updated, content: updatedContent } })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const draft = await composerDraftsRepository.findById(id)
  if (!draft || draft.userId !== session.user.id) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  await draftContentRepository.deleteByDraft(id)
  await composerDraftsRepository.delete(id)

  return NextResponse.json({ success: true })
}
