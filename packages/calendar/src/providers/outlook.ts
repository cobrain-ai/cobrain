/**
 * Microsoft Outlook Calendar Provider
 * Implements OAuth 2.0 and Microsoft Graph API integration
 */

import type {
  CalendarProvider,
  CalendarProviderConfig,
  OAuthTokens,
  CalendarEvent,
  Attendee,
  GetEventsOptions,
} from '../types.js'

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0'
const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0'

const SCOPES = [
  'openid',
  'email',
  'offline_access',
  'Calendars.Read',
  'User.Read',
]

interface GraphEvent {
  id: string
  subject: string
  bodyPreview?: string
  body?: { content: string; contentType: string }
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  isAllDay: boolean
  location?: { displayName: string }
  attendees?: GraphAttendee[]
  onlineMeeting?: { joinUrl: string }
  seriesMasterId?: string
  showAs: string
  organizer?: { emailAddress: { address: string; name?: string } }
}

interface GraphAttendee {
  emailAddress: { address: string; name?: string }
  status: { response: string }
  type: string
}

export class OutlookCalendarProvider implements CalendarProvider {
  readonly type = 'outlook' as const
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor(config: CalendarProviderConfig) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
  }

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: SCOPES.join(' '),
      response_mode: 'query',
      prompt: 'consent',
    })

    if (state) {
      params.set('state', state)
    }

    return `${MICROSOFT_AUTH_URL}/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const response = await fetch(`${MICROSOFT_AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange code: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`${MICROSOFT_AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh token: ${error}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope,
    }
  }

  async revokeToken(_token: string): Promise<void> {
    // Microsoft doesn't have a direct revoke endpoint
    // Users should revoke via https://account.live.com/consent/Manage
    // This is a no-op for now
  }

  async getEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    options: GetEventsOptions = {}
  ): Promise<CalendarEvent[]> {
    const calendarPath = options.calendarId
      ? `/me/calendars/${options.calendarId}/events`
      : '/me/calendar/events'

    const params = new URLSearchParams({
      $filter: `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`,
      $orderby: options.orderBy === 'updated' ? 'lastModifiedDateTime desc' : 'start/dateTime',
      $top: String(options.maxResults ?? 50),
      $select:
        'id,subject,bodyPreview,start,end,isAllDay,location,attendees,onlineMeeting,seriesMasterId,showAs,organizer',
    })

    const response = await fetch(`${GRAPH_API_URL}${calendarPath}?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get events: ${error}`)
    }

    const data = await response.json()
    const events: GraphEvent[] = data.value ?? []

    return events.map((event) => this.mapGraphEvent(event))
  }

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch(`${GRAPH_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get user info: ${error}`)
    }

    const data = await response.json()
    return data.mail ?? data.userPrincipalName
  }

  private mapGraphEvent(event: GraphEvent): CalendarEvent {
    const start = new Date(event.start.dateTime + 'Z')
    const end = new Date(event.end.dateTime + 'Z')

    const attendees: Attendee[] = (event.attendees ?? []).map((a) => ({
      email: a.emailAddress.address,
      name: a.emailAddress.name ?? undefined,
      responseStatus: this.mapResponseStatus(a.status.response),
      isOrganizer: false,
    }))

    return {
      id: event.id,
      provider: 'outlook',
      calendarId: 'primary',
      title: event.subject ?? '(No title)',
      description: event.bodyPreview ?? undefined,
      start,
      end,
      isAllDay: event.isAllDay,
      location: event.location?.displayName ?? undefined,
      attendees,
      meetingLink: event.onlineMeeting?.joinUrl ?? undefined,
      recurringEventId: event.seriesMasterId ?? undefined,
      status: this.mapShowAs(event.showAs),
      organizer: event.organizer
        ? {
            email: event.organizer.emailAddress.address,
            name: event.organizer.emailAddress.name ?? undefined,
            responseStatus: 'accepted',
            isOrganizer: true,
          }
        : undefined,
    }
  }

  private mapResponseStatus(response: string): Attendee['responseStatus'] {
    switch (response.toLowerCase()) {
      case 'accepted':
        return 'accepted'
      case 'declined':
        return 'declined'
      case 'tentativelyaccepted':
        return 'tentative'
      default:
        return 'needsAction'
    }
  }

  private mapShowAs(showAs: string): CalendarEvent['status'] {
    switch (showAs.toLowerCase()) {
      case 'free':
      case 'busy':
      case 'workingelsewhere':
        return 'confirmed'
      case 'tentative':
        return 'tentative'
      case 'oof':
        return 'confirmed'
      default:
        return 'confirmed'
    }
  }
}
