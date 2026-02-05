/**
 * Calendar Integration Types
 * @packageDocumentation
 */

export type CalendarProviderType = 'google' | 'outlook'

export interface CalendarConnection {
  id: string
  userId: string
  provider: CalendarProviderType
  email: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEvent {
  id: string
  provider: CalendarProviderType
  calendarId: string
  title: string
  description?: string
  start: Date
  end: Date
  isAllDay: boolean
  location?: string
  attendees: Attendee[]
  meetingLink?: string
  recurringEventId?: string
  status: 'confirmed' | 'tentative' | 'cancelled'
  organizer?: Attendee
}

export interface Attendee {
  email: string
  name?: string
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction'
  isOrganizer?: boolean
  isSelf?: boolean
}

export interface CalendarProviderConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface OAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope?: string
}

export interface CalendarProvider {
  readonly type: CalendarProviderType

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state?: string): string

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(code: string): Promise<OAuthTokens>

  /**
   * Refresh access token
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>

  /**
   * Revoke tokens
   */
  revokeToken(token: string): Promise<void>

  /**
   * Get calendar events within date range
   */
  getEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    options?: GetEventsOptions
  ): Promise<CalendarEvent[]>

  /**
   * Get user's email from the calendar account
   */
  getUserEmail(accessToken: string): Promise<string>
}

export interface GetEventsOptions {
  calendarId?: string
  maxResults?: number
  singleEvents?: boolean
  orderBy?: 'startTime' | 'updated'
}

export interface HeadsUpNotification {
  id: string
  eventId: string
  event: CalendarEvent
  userId: string
  scheduledFor: Date
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed'
  relevantNotes: RelevantNote[]
  attendeeMatches: AttendeeMatch[]
  topicMatches: TopicMatch[]
  createdAt: Date
}

export interface RelevantNote {
  noteId: string
  content: string
  relevanceScore: number
  matchType: 'attendee' | 'topic' | 'both'
}

export interface AttendeeMatch {
  attendee: Attendee
  notes: RelevantNote[]
  entityId?: string
}

export interface TopicMatch {
  topic: string
  notes: RelevantNote[]
  confidence: number
}

export interface HeadsUpConfig {
  enabled: boolean
  leadTimeMinutes: number // 5, 10, 15, 30
  maxNotesPerEvent: number
  minRelevanceScore: number
}

export const DEFAULT_HEADS_UP_CONFIG: HeadsUpConfig = {
  enabled: true,
  leadTimeMinutes: 10,
  maxNotesPerEvent: 5,
  minRelevanceScore: 0.5,
}
