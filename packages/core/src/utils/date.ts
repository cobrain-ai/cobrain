/**
 * Format a date to ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString()
}

/**
 * Parse a date string or timestamp
 */
export function parseDate(input: string | number | Date): Date {
  if (input instanceof Date) {
    return input
  }
  const date = new Date(input)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${input}`)
  }
  return date
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(input: unknown): input is Date {
  return input instanceof Date && !isNaN(input.getTime())
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}
