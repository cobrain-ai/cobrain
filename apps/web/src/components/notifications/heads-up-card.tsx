'use client'

import { useState } from 'react'

export interface HeadsUpData {
  id: string
  event: {
    title: string
    start: string
    location?: string
    attendees: { name?: string; email: string }[]
    meetingLink?: string
  }
  relevantNotes: {
    noteId: string
    content: string
    matchType: 'attendee' | 'topic' | 'both'
  }[]
  attendeeMatches: {
    attendee: { name?: string; email: string }
    notes: { noteId: string; content: string }[]
  }[]
}

interface HeadsUpCardProps {
  data: HeadsUpData
  onDismiss: (id: string) => void
  onSnooze: (id: string, minutes: number) => void
  onViewNote: (noteId: string) => void
}

export function HeadsUpCard({
  data,
  onDismiss,
  onSnooze,
  onViewNote,
}: HeadsUpCardProps) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const eventTime = new Date(data.event.start).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const attendeeNames = data.event.attendees
    .map((a) => a.name || a.email.split('@')[0])
    .slice(0, 3)

  const hasMoreAttendees = data.event.attendees.length > 3

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-down">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Heads Up
            </span>
          </div>
          <span className="text-sm text-purple-600 dark:text-purple-400">
            {eventTime}
          </span>
        </div>

        {/* Event Info */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {data.event.title}
          </h3>
          {data.event.location && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <LocationIcon className="w-4 h-4 inline mr-1" />
              {data.event.location}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <UserIcon className="w-4 h-4 inline mr-1" />
            {attendeeNames.join(', ')}
            {hasMoreAttendees && ` +${data.event.attendees.length - 3} more`}
          </p>
        </div>

        {/* Relevant Notes */}
        {data.relevantNotes.length > 0 && (
          <div className="px-4 py-3">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {data.relevantNotes.length} relevant note
                {data.relevantNotes.length !== 1 ? 's' : ''}
              </span>
              <ChevronIcon
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </div>

            {expanded && (
              <div className="mt-3 space-y-2">
                {data.relevantNotes.map((note) => (
                  <button
                    key={note.noteId}
                    onClick={() => onViewNote(note.noteId)}
                    className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {note.content}
                    </p>
                    <span
                      className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${
                        note.matchType === 'attendee'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : note.matchType === 'topic'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {note.matchType === 'attendee'
                        ? 'Person match'
                        : note.matchType === 'topic'
                          ? 'Topic match'
                          : 'Person + Topic'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          {data.event.meetingLink && (
            <a
              href={data.event.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
            >
              Join Meeting
            </a>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
            >
              Snooze
            </button>

            {showSnoozeOptions && (
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {[
                  { label: '5 min', value: 5 },
                  { label: '10 min', value: 10 },
                  { label: '15 min', value: 15 },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSnooze(data.id, option.value)
                      setShowSnoozeOptions(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onDismiss(data.id)}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// Icons
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
