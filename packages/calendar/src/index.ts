/**
 * @cobrain/calendar
 * Calendar integration package for Google Calendar and Outlook
 */

// Types
export type {
  CalendarProviderType,
  CalendarConnection,
  CalendarEvent,
  Attendee,
  CalendarProviderConfig,
  OAuthTokens,
  CalendarProvider,
  GetEventsOptions,
  HeadsUpNotification,
  RelevantNote,
  AttendeeMatch,
  TopicMatch,
  HeadsUpConfig,
} from './types.js'

export { DEFAULT_HEADS_UP_CONFIG } from './types.js'

// Providers
export { GoogleCalendarProvider } from './providers/google.js'
export { OutlookCalendarProvider } from './providers/outlook.js'

// Services
export { CalendarService } from './service.js'
export type { CalendarServiceConfig, TokenStorage } from './service.js'

export { HeadsUpService } from './heads-up.js'
export type {
  HeadsUpStorage,
  NoteSearch,
  EntitySearch,
  Note,
  Entity,
} from './heads-up.js'
