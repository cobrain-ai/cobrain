import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { remindersRepository } from '@cobrain/database'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'complete':
        await remindersRepository.markComplete(id)
        break
      case 'dismiss':
        await remindersRepository.dismiss(id)
        break
      case 'triggered':
        await remindersRepository.markTriggered(id)
        break
      default:
        // Update reminder fields
        const reminder = await remindersRepository.update(id, body)
        return NextResponse.json({ reminder })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update reminder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    await remindersRepository.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete reminder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
