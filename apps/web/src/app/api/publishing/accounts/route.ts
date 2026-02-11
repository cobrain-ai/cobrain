import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { publishingAccountsRepository } from '@cobrain/database'

const connectAccountSchema = z.object({
  platform: z.enum([
    'threads', 'hashnode', 'twitter', 'wordpress', 'medium',
    'linkedin', 'mastodon', 'bluesky', 'devto', 'ghost',
  ]),
  accountId: z.string().min(1),
  accountName: z.string().optional(),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accounts = await publishingAccountsRepository.findByUser(session.user.id)
  // Strip sensitive tokens from response
  const safeAccounts = accounts.map((a) => ({
    id: a.id,
    platform: a.platform,
    accountId: a.accountId,
    accountName: a.accountName,
    isActive: a.isActive,
    connectedAt: a.connectedAt,
    hasToken: !!a.accessToken,
  }))

  return NextResponse.json({ accounts: safeAccounts })
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

  const result = connectAccountSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const account = await publishingAccountsRepository.create({
    userId: session.user.id,
    ...result.data,
  })

  return NextResponse.json(
    {
      account: {
        id: account.id,
        platform: account.platform,
        accountId: account.accountId,
        accountName: account.accountName,
        isActive: account.isActive,
        connectedAt: account.connectedAt,
      },
    },
    { status: 201 }
  )
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('id')
  if (!accountId) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
  }

  const account = await publishingAccountsRepository.findById(accountId)
  if (!account || account.userId !== session.user.id) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  await publishingAccountsRepository.disconnect(accountId)
  return NextResponse.json({ success: true })
}
