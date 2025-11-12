/**
 * Format a date as relative time (e.g., "2 hours ago")
 * Falls back to absolute date if more than 7 days ago
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Less than a minute
  if (seconds < 60) {
    return 'just now'
  }

  // Minutes
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  // Hours
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  // Days
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }

  // For dates older than 7 days, show the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Format a date with time (e.g., "Nov 8, 2025 at 3:45 PM")
 * Used in tooltips or detailed views
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
