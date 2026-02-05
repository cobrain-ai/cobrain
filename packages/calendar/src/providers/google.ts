/**
 * Google Calendar Provider
 * Implements OAuth 2.0 and Calendar API integration
 */

import { google, calendar_v3 } from 'googleapis'
import type {
  CalendarProvider,
  CalendarProviderConfig,
  OAuthTokens,
  CalendarEvent,
  Attendee,
  GetEventsOptions,
} from '../types.js'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

export class GoogleCalendarProvider implements CalendarProvider {
  readonly type = 'google' as const
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>

  constructor(config: CalendarProviderConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )
  }

  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent to get refresh token
      state,
    })
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const { tokens } = await this.oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google')
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
      scope: tokens.scope ?? undefined,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await this.oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('Failed to refresh Google access token')
    }

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token ?? refreshToken,
      expiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600 * 1000),
      scope: credentials.scope ?? undefined,
    }
  }

  async revokeToken(token: string): Promise<void> {
    await this.oauth2Client.revokeToken(token)
  }

  async getEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    options: GetEventsOptions = {}
  ): Promise<CalendarEvent[]> {
    this.oauth2Client.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const response = await calendar.events.list({
      calendarId: options.calendarId ?? 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: options.maxResults ?? 50,
      singleEvents: options.singleEvents ?? true,
      orderBy: options.orderBy ?? 'startTime',
    })

    const events = response.data.items ?? []
    return events.map((event) => this.mapGoogleEvent(event))
  }

  async getUserEmail(accessToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ access_token: accessToken })

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
    const response = await oauth2.userinfo.get()

    if (!response.data.email) {
      throw new Error('Failed to get user email from Google')
    }

    return response.data.email
  }

  private mapGoogleEvent(event: calendar_v3.Schema$Event): CalendarEvent {
    const start = event.start?.dateTime
      ? new Date(event.start.dateTime)
      : event.start?.date
        ? new Date(event.start.date)
        : new Date()

    const end = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : event.end?.date
        ? new Date(event.end.date)
        : new Date()

    const isAllDay = !event.start?.dateTime

    const attendees: Attendee[] = (event.attendees ?? []).map((a) => ({
      email: a.email ?? '',
      name: a.displayName ?? undefined,
      responseStatus: this.mapResponseStatus(a.responseStatus),
      isOrganizer: a.organizer ?? false,
      isSelf: a.self ?? false,
    }))

    // Find meeting link from conferenceData or description
    let meetingLink: string | undefined
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (e) => e.entryPointType === 'video'
      )
      meetingLink = videoEntry?.uri ?? undefined
    }

    return {
      id: event.id ?? '',
      provider: 'google',
      calendarId: event.organizer?.email ?? 'primary',
      title: event.summary ?? '(No title)',
      description: event.description ?? undefined,
      start,
      end,
      isAllDay,
      location: event.location ?? undefined,
      attendees,
      meetingLink,
      recurringEventId: event.recurringEventId ?? undefined,
      status: this.mapEventStatus(event.status),
      organizer: event.organizer
        ? {
            email: event.organizer.email ?? '',
            name: event.organizer.displayName ?? undefined,
            responseStatus: 'accepted',
            isOrganizer: true,
          }
        : undefined,
    }
  }

  private mapResponseStatus(
    status: string | null | undefined
  ): Attendee['responseStatus'] {
    switch (status) {
      case 'accepted':
        return 'accepted'
      case 'declined':
        return 'declined'
      case 'tentative':
        return 'tentative'
      default:
        return 'needsAction'
    }
  }

  private mapEventStatus(
    status: string | null | undefined
  ): CalendarEvent['status'] {
    switch (status) {
      case 'confirmed':
        return 'confirmed'
      case 'tentative':
        return 'tentative'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'confirmed'
    }
  }
}
