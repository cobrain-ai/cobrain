# PRD: Calendar Integration for Context-Triggered Notifications

**Author**: Product Design Agent
**Date**: 2026-02-05
**Status**: Draft
**GitHub Issue**: #49

---

## Executive Summary

Calendar Integration enables CoBrain to connect with users' calendar services (Google Calendar, Microsoft Outlook) and proactively surface relevant notes before meetings. This "Heads Up" feature analyzes meeting attendees, topics, and context to automatically prepare users with relevant information, fulfilling the proactive intelligence promise of CoBrain.

---

## Problem Statement

Current pain points without calendar integration:

- **Meeting Prep Friction:** Users manually search notes before meetings to find relevant context
- **Context Loss:** Important conversation history with attendees isn't surfaced automatically
- **Missed Commitments:** Calendar commitments aren't connected to note-based reminders
- **Reactive System:** Users must actively request information rather than receiving proactive assistance

---

## Goals & Objectives

### Primary Goals
- Seamlessly connect with major calendar providers
- Surface relevant notes 10 minutes before meetings
- Match meeting attendees to notes mentioning those people
- Match meeting topics to related note content

### Success Metrics (KPIs)
| Metric | Target |
|--------|--------|
| Calendar connection rate | 60% of active users |
| "Heads Up" notification engagement | 40% click-through |
| Meeting prep time reduction | 50% (self-reported) |
| User satisfaction | 4.5+ rating |

---

## User Stories

### US-C-1: Connect Calendar
- As a user
- I want to connect my Google Calendar
- So that CoBrain can access my meeting schedule

**Acceptance Criteria**:
- [ ] OAuth 2.0 flow for Google Calendar
- [ ] OAuth 2.0 flow for Microsoft Outlook
- [ ] Clear permission explanation before auth
- [ ] Secure token storage (encrypted at rest)
- [ ] Ability to disconnect at any time

### US-C-2: Pre-Meeting Heads Up
- As a meeting participant
- I want to receive relevant notes before my meeting with John
- So that I can prepare without searching

**Acceptance Criteria**:
- [ ] Notification 10 minutes before meeting
- [ ] Shows notes mentioning attendees
- [ ] Shows notes about meeting topic
- [ ] Configurable timing (5/10/15/30 min)
- [ ] Can be dismissed or snoozed

### US-C-3: Meeting Topic Matching
- As a project manager
- I want notes about "Project Alpha" surfaced before the "Project Alpha Review" meeting
- So that I have all relevant context

**Acceptance Criteria**:
- [ ] Extract topics from meeting title/description
- [ ] Semantic matching with note content
- [ ] Show confidence score for relevance
- [ ] Link to source notes

### US-C-4: Attendee Context
- As a user
- I want to see my conversation history with Sarah before our 1:1
- So that I remember what we discussed last time

**Acceptance Criteria**:
- [ ] Match attendee names/emails to note entities
- [ ] Show recent notes mentioning the person
- [ ] Show commitments made to/by this person
- [ ] Timeline of interactions

### US-C-5: Calendar Commitment Tracking
- As a busy professional
- I want calendar events automatically tracked as commitments
- So that I don't miss important appointments

**Acceptance Criteria**:
- [ ] Create reminder for calendar events
- [ ] Mark commitments when calendar event is created
- [ ] Suggest follow-up after meetings

---

## Feature Specifications

### Core Features (P0 - Must Have)

#### 1. OAuth Calendar Connection
- **Description:** Connect to calendar services via OAuth 2.0
- **Providers:**
  - Google Calendar (primary)
  - Microsoft Outlook/365
- **Priority:** P0
- **Complexity:** Medium

#### 2. Pre-Meeting Notifications
- **Description:** "Heads Up" alerts before meetings
- **Components:**
  - Notification scheduling (10 min before)
  - Relevant notes surfacing
  - Quick actions (open note, snooze)
- **Priority:** P0
- **Complexity:** High

#### 3. Attendee Matching
- **Description:** Match meeting attendees to notes
- **Components:**
  - Email-to-name resolution
  - Entity matching algorithm
  - Relevance scoring
- **Priority:** P0
- **Complexity:** High

### Secondary Features (P1 - Should Have)

#### 4. Topic Extraction
- **Description:** Extract topics from meeting metadata
- **Components:**
  - Title/description parsing
  - Keyword extraction
  - Semantic similarity with notes
- **Priority:** P1
- **Complexity:** Medium

#### 5. Meeting Summaries
- **Description:** Auto-generate meeting prep summaries
- **Components:**
  - AI-generated summary
  - Key points from related notes
  - Action items from previous meetings
- **Priority:** P1
- **Complexity:** High

### Future Features (P2 - Nice to Have)

#### 6. Calendar Event Creation
- **Description:** Create calendar events from notes
- **Complexity:** Medium

#### 7. Bi-directional Sync
- **Description:** Sync CoBrain reminders to calendar
- **Complexity:** Very High

---

## Technical Requirements

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Calendar Integration                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CalendarService                         │    │
│  │  - connectProvider(provider, authCode)               │    │
│  │  - getEvents(startDate, endDate)                    │    │
│  │  - subscribeToChanges(webhookUrl)                   │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │              Provider Adapters                       │    │
│  │  ┌───────────────┐  ┌────────────────────────┐      │    │
│  │  │ GoogleCalendar│  │ OutlookCalendar        │      │    │
│  │  │ Adapter       │  │ Adapter                │      │    │
│  │  └───────────────┘  └────────────────────────┘      │    │
│  └──────────────────────────────────────────────────────┘    │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐    │
│  │              HeadsUpService                          │    │
│  │  - scheduleHeadsUp(event)                           │    │
│  │  - findRelevantNotes(event)                         │    │
│  │  - matchAttendees(event)                            │    │
│  │  - matchTopics(event)                               │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-C-1 | System shall authenticate with Google Calendar via OAuth 2.0 |
| FR-C-2 | System shall authenticate with Microsoft Graph API via OAuth 2.0 |
| FR-C-3 | System shall retrieve calendar events for next 7 days |
| FR-C-4 | System shall schedule notifications 10 min before events |
| FR-C-5 | System shall match attendee emails to note entities |
| FR-C-6 | System shall extract keywords from meeting titles |
| FR-C-7 | System shall find semantically similar notes |
| FR-C-8 | System shall respect user notification preferences |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-C-1 | OAuth tokens encrypted at rest (AES-256) |
| NFR-C-2 | Minimal calendar permissions (read-only) |
| NFR-C-3 | Calendar sync latency < 5 minutes |
| NFR-C-4 | Notification delivery within 1 minute of schedule |
| NFR-C-5 | Support 10,000+ concurrent calendar connections |

### Security Requirements

| ID | Requirement |
|----|-------------|
| SR-C-1 | OAuth tokens must never be logged |
| SR-C-2 | Refresh tokens stored with encryption |
| SR-C-3 | Token refresh happens server-side only |
| SR-C-4 | Users can revoke access at any time |
| SR-C-5 | Calendar data not stored permanently (cache only) |

---

## Dependencies

### External APIs
| API | Purpose | Auth |
|-----|---------|------|
| Google Calendar API | Calendar events | OAuth 2.0 |
| Microsoft Graph API | Outlook calendar | OAuth 2.0 |

### Internal Dependencies
- `@cobrain/database` - User preferences, token storage
- `@cobrain/core` - AI for topic extraction
- Notification system (web push, mobile push)
- Entity extraction pipeline

### New Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| googleapis | Google Calendar API | ^144.0.0 |
| @azure/msal-node | Microsoft auth | ^2.16.0 |
| @microsoft/microsoft-graph-client | Graph API | ^3.0.7 |

---

## Out of Scope (V1)

- Apple Calendar (iCloud) integration
- Calendar event creation from CoBrain
- Meeting transcription/notes sync
- Multi-account per provider
- Shared/team calendars
- All-day event handling

---

## Competitive Analysis

| Feature | CoBrain | Mem | Notion | Reflect |
|---------|---------|-----|--------|---------|
| Google Calendar | Planned | Yes | Yes | Yes |
| Outlook Calendar | Planned | Yes | Yes | No |
| Pre-meeting notes | Planned | Yes | No | No |
| Attendee matching | Planned | Yes | No | No |
| Topic extraction | Planned | Yes | No | No |
| Context-triggered | Planned | Yes | No | No |

**Mem's Heads Up Feature:** Our primary competitor. We aim to match their functionality while integrating with CoBrain's unique zero-organization approach and knowledge graph.

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OAuth scope changes | Low | High | Abstract provider APIs, monitor deprecations |
| Rate limiting by providers | Medium | Medium | Implement caching, efficient polling |
| Low calendar connection rate | Medium | High | Emphasize value prop, simplify flow |
| Poor attendee matching | Medium | Medium | Fuzzy matching, user correction UI |
| Token expiration issues | Low | High | Proactive refresh, error handling |

---

## Implementation Phases

### Phase 1: OAuth & Basic Connection (Week 1)
- [ ] Google Calendar OAuth setup
- [ ] Token storage (encrypted)
- [ ] Calendar connection UI in settings
- [ ] Basic event retrieval

### Phase 2: Heads Up Notifications (Week 2)
- [ ] Notification scheduling service
- [ ] Pre-meeting notification delivery
- [ ] Basic attendee matching
- [ ] UI for Heads Up cards

### Phase 3: Smart Matching (Week 3)
- [ ] Topic extraction from events
- [ ] Semantic note matching
- [ ] Relevance scoring
- [ ] Meeting prep summary

### Phase 4: Outlook & Polish (Week 4)
- [ ] Microsoft Graph OAuth
- [ ] Outlook calendar adapter
- [ ] Settings UI improvements
- [ ] Testing and refinement

---

## API Design

### Calendar Service API

```typescript
interface CalendarProvider {
  type: 'google' | 'outlook'
  connect(authCode: string): Promise<CalendarConnection>
  disconnect(): Promise<void>
  getEvents(start: Date, end: Date): Promise<CalendarEvent[]>
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  attendees: Attendee[]
  location?: string
  provider: 'google' | 'outlook'
}

interface Attendee {
  email: string
  name?: string
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction'
}

interface HeadsUpNotification {
  eventId: string
  event: CalendarEvent
  relevantNotes: Note[]
  attendeeNotes: Map<string, Note[]>
  topicMatches: { topic: string; notes: Note[]; score: number }[]
  scheduledFor: Date
}
```

---

## Appendix

### OAuth Scopes Required

**Google Calendar:**
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`

**Microsoft Graph:**
- `Calendars.Read`
- `User.Read`

### References
- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [Mem Heads Up Feature](https://get.mem.ai/features/heads-up)

---

**End of PRD**
