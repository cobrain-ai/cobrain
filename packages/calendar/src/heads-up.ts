/**
 * Heads Up Service
 * Schedules and manages pre-meeting notifications with relevant notes
 */

import type {
  CalendarEvent,
  HeadsUpNotification,
  HeadsUpConfig,
  RelevantNote,
  AttendeeMatch,
  TopicMatch,
  Attendee,
  DEFAULT_HEADS_UP_CONFIG,
} from './types.js'

export interface Note {
  id: string
  content: string
  createdAt: Date
}

export interface Entity {
  id: string
  type: string
  value: string
  normalizedValue?: string
  noteId: string
}

export interface HeadsUpStorage {
  getHeadsUp(eventId: string): Promise<HeadsUpNotification | null>
  saveHeadsUp(notification: HeadsUpNotification): Promise<void>
  getPendingHeadsUps(before: Date): Promise<HeadsUpNotification[]>
  updateHeadsUpStatus(
    id: string,
    status: HeadsUpNotification['status']
  ): Promise<void>
  deleteHeadsUp(id: string): Promise<void>
}

export interface NoteSearch {
  searchByContent(query: string, limit?: number): Promise<Note[]>
  getRecentNotesByEntity(entityId: string, limit?: number): Promise<Note[]>
}

export interface EntitySearch {
  findPersonByEmail(email: string): Promise<Entity | null>
  findPersonByName(name: string): Promise<Entity[]>
}

export class HeadsUpService {
  private storage: HeadsUpStorage
  private noteSearch: NoteSearch
  private entitySearch: EntitySearch
  private config: HeadsUpConfig

  constructor(
    storage: HeadsUpStorage,
    noteSearch: NoteSearch,
    entitySearch: EntitySearch,
    config: HeadsUpConfig = { ...DEFAULT_HEADS_UP_CONFIG }
  ) {
    this.storage = storage
    this.noteSearch = noteSearch
    this.entitySearch = entitySearch
    this.config = config
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HeadsUpConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Schedule a Heads Up notification for an event
   */
  async scheduleHeadsUp(
    userId: string,
    event: CalendarEvent
  ): Promise<HeadsUpNotification | null> {
    if (!this.config.enabled) {
      return null
    }

    // Skip all-day events and cancelled events
    if (event.isAllDay || event.status === 'cancelled') {
      return null
    }

    // Check if already scheduled
    const existing = await this.storage.getHeadsUp(event.id)
    if (existing) {
      return existing
    }

    // Calculate notification time
    const scheduledFor = new Date(
      event.start.getTime() - this.config.leadTimeMinutes * 60 * 1000
    )

    // Don't schedule if the time has passed
    if (scheduledFor.getTime() < Date.now()) {
      return null
    }

    // Find relevant notes
    const [attendeeMatches, topicMatches] = await Promise.all([
      this.findAttendeeMatches(event.attendees),
      this.findTopicMatches(event),
    ])

    // Combine all relevant notes
    const allNotes = new Map<string, RelevantNote>()

    for (const match of attendeeMatches) {
      for (const note of match.notes) {
        const existing = allNotes.get(note.noteId)
        if (!existing || existing.relevanceScore < note.relevanceScore) {
          allNotes.set(note.noteId, note)
        }
      }
    }

    for (const match of topicMatches) {
      for (const note of match.notes) {
        const existing = allNotes.get(note.noteId)
        if (!existing || existing.relevanceScore < note.relevanceScore) {
          allNotes.set(note.noteId, {
            ...note,
            matchType: existing ? 'both' : 'topic',
          })
        }
      }
    }

    // Filter and limit notes
    const relevantNotes = Array.from(allNotes.values())
      .filter((n) => n.relevanceScore >= this.config.minRelevanceScore)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.config.maxNotesPerEvent)

    // Create notification
    const notification: HeadsUpNotification = {
      id: `headsup_${event.id}_${Date.now()}`,
      eventId: event.id,
      event,
      userId,
      scheduledFor,
      status: 'pending',
      relevantNotes,
      attendeeMatches,
      topicMatches,
      createdAt: new Date(),
    }

    await this.storage.saveHeadsUp(notification)

    return notification
  }

  /**
   * Get pending notifications that should be sent
   */
  async getPendingNotifications(): Promise<HeadsUpNotification[]> {
    return this.storage.getPendingHeadsUps(new Date())
  }

  /**
   * Mark a notification as sent
   */
  async markAsSent(id: string): Promise<void> {
    await this.storage.updateHeadsUpStatus(id, 'sent')
  }

  /**
   * Dismiss a notification
   */
  async dismiss(id: string): Promise<void> {
    await this.storage.updateHeadsUpStatus(id, 'dismissed')
  }

  /**
   * Snooze a notification
   */
  async snooze(id: string, minutes: number): Promise<void> {
    const notification = await this.storage.getHeadsUp(id)
    if (!notification) {
      return
    }

    // Create a new notification with updated time
    const newNotification: HeadsUpNotification = {
      ...notification,
      id: `headsup_${notification.eventId}_${Date.now()}`,
      scheduledFor: new Date(Date.now() + minutes * 60 * 1000),
      status: 'pending',
    }

    await this.storage.updateHeadsUpStatus(id, 'snoozed')
    await this.storage.saveHeadsUp(newNotification)
  }

  /**
   * Find notes related to meeting attendees
   */
  private async findAttendeeMatches(attendees: Attendee[]): Promise<AttendeeMatch[]> {
    const matches: AttendeeMatch[] = []

    for (const attendee of attendees) {
      // Skip self
      if (attendee.isSelf) {
        continue
      }

      // Try to find person by email first
      let entity = await this.entitySearch.findPersonByEmail(attendee.email)

      // If not found by email, try by name
      if (!entity && attendee.name) {
        const entities = await this.entitySearch.findPersonByName(attendee.name)
        entity = entities[0] ?? null
      }

      if (entity) {
        const notes = await this.noteSearch.getRecentNotesByEntity(entity.id, 10)
        const relevantNotes: RelevantNote[] = notes.map((note, index) => ({
          noteId: note.id,
          content: note.content.slice(0, 200),
          relevanceScore: 1 - index * 0.1, // Decay by recency
          matchType: 'attendee' as const,
        }))

        matches.push({
          attendee,
          notes: relevantNotes,
          entityId: entity.id,
        })
      }
    }

    return matches
  }

  /**
   * Find notes related to meeting topics
   */
  private async findTopicMatches(event: CalendarEvent): Promise<TopicMatch[]> {
    const matches: TopicMatch[] = []

    // Extract keywords from title
    const titleKeywords = this.extractKeywords(event.title)

    for (const keyword of titleKeywords) {
      const notes = await this.noteSearch.searchByContent(keyword, 5)

      if (notes.length > 0) {
        const relevantNotes: RelevantNote[] = notes.map((note, index) => ({
          noteId: note.id,
          content: note.content.slice(0, 200),
          relevanceScore: 0.8 - index * 0.1, // Slightly lower than attendee matches
          matchType: 'topic' as const,
        }))

        matches.push({
          topic: keyword,
          notes: relevantNotes,
          confidence: 0.8,
        })
      }
    }

    return matches
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common words and punctuation
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'meeting', 'call', 'sync', 'chat', 'discussion', 'review', 'update',
    ])

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))

    // Return unique keywords
    return [...new Set(words)]
  }
}
