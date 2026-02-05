import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { SharedViewClient } from './client'

interface SharedViewPageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ password?: string }>
}

interface ViewData {
  view: {
    id: string
    name: string
    description: string | null
    type: string
    layout: string
    createdAt: string
    updatedAt: string
    hasPassword: boolean
  }
  data: {
    notes: Array<{
      id: string
      content: string
      createdAt: string
      updatedAt: string
      metadata?: {
        source?: string
        isPinned?: boolean
      }
    }>
    total: number
  }
  requiresPassword?: boolean
  passwordError?: boolean
}

async function getSharedView(
  token: string,
  password?: string
): Promise<ViewData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = new URL(`${baseUrl}/api/shared/${token}`)
    if (password) {
      url.searchParams.set('password', password)
    }

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    })

    if (response.status === 401) {
      const data = await response.json()
      return {
        view: data.view,
        data: { notes: [], total: 0 },
        requiresPassword: true,
        passwordError: data.error === 'Invalid password',
      }
    }

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

export default async function SharedViewPage({
  params,
  searchParams,
}: SharedViewPageProps) {
  const { token } = await params
  const { password } = await searchParams
  const viewData = await getSharedView(token, password)

  if (!viewData) {
    notFound()
  }

  // If password required, show password form
  if (viewData.requiresPassword) {
    return (
      <SharedViewClient
        token={token}
        requiresPassword
        passwordError={viewData.passwordError}
        viewName={viewData.view?.name}
      />
    )
  }

  const { view, data } = viewData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
              Shared View
            </span>
            <span>-</span>
            <span>{view.type}</span>
            <span>-</span>
            <span>{view.layout} layout</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {view.name}
          </h1>
          {view.description && (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {view.description}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {data.total} {data.total === 1 ? 'note' : 'notes'} - Last updated{' '}
            {new Date(view.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {data.notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No notes in this view.</p>
          </div>
        ) : (
          <div
            className={
              view.layout === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-4'
            }
          >
            {data.notes.map((note) => (
              <article
                key={note.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  {note.metadata?.isPinned && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {note.content}
                </p>
                {note.metadata?.source && (
                  <p className="mt-2 text-xs text-gray-500">
                    Source: {note.metadata.source}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            Shared from <strong>CoBrain</strong> - Your AI Second Brain
          </p>
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: SharedViewPageProps) {
  const { token } = await params
  const viewData = await getSharedView(token)

  if (!viewData) {
    return {
      title: 'View Not Found - CoBrain',
    }
  }

  return {
    title: `${viewData.view.name} - Shared View | CoBrain`,
    description:
      viewData.view.description ||
      `A shared view from CoBrain with ${viewData.data.total} notes.`,
  }
}
