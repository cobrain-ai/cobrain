/**
 * Format a date string as a relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'Just now'
  }

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  }

  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }

  if (diffDays === 1) {
    return 'Yesterday'
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  // For older dates, show the actual date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Format a date for display in chat messages
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Group dates by day for section headers
 */
export function groupByDay<T extends { createdAt: string }>(
  items: T[]
): { title: string; data: T[] }[] {
  const groups: Map<string, T[]> = new Map()
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  for (const item of items) {
    const date = new Date(item.createdAt)
    const dateString = date.toDateString()

    let title: string
    if (dateString === today) {
      title = 'Today'
    } else if (dateString === yesterday) {
      title = 'Yesterday'
    } else {
      title = date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    }

    const existing = groups.get(title) || []
    existing.push(item)
    groups.set(title, existing)
  }

  return Array.from(groups.entries()).map(([title, data]) => ({
    title,
    data,
  }))
}
