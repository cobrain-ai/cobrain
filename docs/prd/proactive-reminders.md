# PRD: Proactive Reminder Scheduling System

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**GitHub Issue**: #36

---

## Executive Summary

Implement a complete proactive reminder scheduling system that monitors pending reminders, triggers notifications at the appropriate time, and provides users with actionable notification UI. This transforms CoBrain from a passive note-taking system into an active cognitive assistant that reminds users of commitments, tasks, and time-sensitive information.

---

## Problem Statement

CoBrain currently extracts reminders from notes (time-based, commitments, follow-ups) and stores them in the database, but:

- **No active scheduling**: Reminders sit dormant in the database without triggering
- **No notification delivery**: Users must manually check for due reminders
- **No user feedback**: No way to snooze, dismiss, or mark reminders complete
- **Missing the "proactive" promise**: PRD promises proactive notifications but they don't exist

**User Pain Points:**
1. "I wrote down 'remind me to call John at 2pm' but nothing happened at 2pm"
2. "How do I see my upcoming reminders?"
3. "I need to snooze this reminder for 30 minutes"
4. "I want to stop getting reminded about this"

---

## Goals & Objectives

### Primary Goals
1. **Trigger reminders on time**: Pending reminders fire within 1 minute of scheduled time
2. **Visible notifications**: Users see clear, actionable notifications in the app
3. **Quick actions**: Users can complete, snooze, or dismiss reminders with one click

### Secondary Goals
1. Push notifications when browser is in background (Web Push API)
2. Notification preferences (quiet hours, batch notifications)
3. Notification history/center

### Success Metrics (KPIs)
| Metric | Target |
|--------|--------|
| Reminder trigger accuracy | Within 1 minute of scheduled time |
| Notification engagement rate | >40% (click/action taken) |
| Snooze usage | Track for UX optimization |
| Reminder completion rate | >60% marked complete (not dismissed) |

---

## User Stories

### US-1: Automatic Reminder Triggering
**As a** user who creates time-based reminders
**I want** the app to notify me at the scheduled time
**So that** I don't have to remember to check my reminders

**Acceptance Criteria:**
- [ ] Reminders trigger within 1 minute of `triggerAt` time
- [ ] Notification shows reminder message and source note preview
- [ ] Works while app is open in browser
- [ ] Works in background (Web Push)

### US-2: In-App Notification Banner
**As a** user working in CoBrain
**I want** to see a notification banner when a reminder triggers
**So that** I'm aware of due reminders without leaving my current task

**Acceptance Criteria:**
- [ ] Banner appears at top of screen with reminder message
- [ ] Banner shows "Complete", "Snooze", "Dismiss" buttons
- [ ] Multiple reminders stack or queue
- [ ] Banner auto-dismisses after 30 seconds if no action

### US-3: Snooze Functionality
**As a** busy user
**I want** to snooze a reminder for a custom duration
**So that** I can handle it later without dismissing it

**Acceptance Criteria:**
- [ ] Quick snooze options: 15min, 30min, 1hr, 3hr, tomorrow
- [ ] Custom snooze time picker
- [ ] Snoozed reminders update `triggerAt` in database
- [ ] Snooze count tracked for analytics

### US-4: Notification Center
**As a** user who may have missed notifications
**I want** a notification center showing recent/pending reminders
**So that** I can see what I've missed and what's coming up

**Acceptance Criteria:**
- [ ] Bell icon in header with badge showing pending count
- [ ] Dropdown shows recent triggered reminders
- [ ] Shows upcoming reminders for next 24 hours
- [ ] Quick actions available in dropdown

### US-5: Recurring Reminders
**As a** user with regular tasks
**I want** recurring reminders to automatically reschedule
**So that** daily/weekly reminders keep working

**Acceptance Criteria:**
- [ ] After completing recurring reminder, next occurrence is scheduled
- [ ] Cron pattern interpreted correctly
- [ ] Option to skip one occurrence
- [ ] Option to stop recurring series

### US-6: Notification Preferences
**As a** user who needs focus time
**I want** to set quiet hours and notification preferences
**So that** I'm not disturbed during important work

**Acceptance Criteria:**
- [ ] Set quiet hours (e.g., 10pm - 8am)
- [ ] Option to disable in-app banners
- [ ] Option to disable browser push notifications
- [ ] Settings saved per-user

---

## Feature Specifications

### Core Features

#### 1. Reminder Scheduler Service
**Description**: Background service that checks for due reminders and triggers notifications
**Priority**: P0 (Critical)
**Complexity**: Medium

**Technical Details:**
- Polling-based scheduler (check every 30 seconds)
- Queries `reminders` table for `status = 'pending' AND triggerAt <= NOW()`
- Updates status to `triggered` when firing
- Handles recurring reminders by creating next occurrence

#### 2. Notification Banner Component
**Description**: Toast-style banner for in-app notifications
**Priority**: P0 (Critical)
**Complexity**: Medium

**Technical Details:**
- Fixed position at top of viewport
- Stacks multiple notifications with queue
- Animates in/out
- Quick action buttons integrated
- Links to source note

#### 3. Notification Center (Bell Icon)
**Description**: Dropdown showing notification history and upcoming reminders
**Priority**: P0 (Critical)
**Complexity**: Medium

**Technical Details:**
- Badge shows count of triggered + pending (next 1hr)
- Tabs: "Triggered" / "Upcoming" / "History"
- Each item shows message, time, quick actions
- "Mark all read" functionality

#### 4. Web Push Notifications
**Description**: Browser push notifications for background operation
**Priority**: P1 (Should Have)
**Complexity**: High

**Technical Details:**
- Service Worker registration
- Web Push API with VAPID keys
- Push subscription storage in database
- Backend push endpoint

#### 5. Snooze Functionality
**Description**: Postpone reminders with preset or custom durations
**Priority**: P0 (Critical)
**Complexity**: Low

**Technical Details:**
- Preset buttons: 15m, 30m, 1h, 3h, Tomorrow 9am
- Custom date/time picker
- Updates `triggerAt` and resets status to `pending`

#### 6. User Preferences
**Description**: Notification settings per user
**Priority**: P1 (Should Have)
**Complexity**: Low

**Technical Details:**
- Stored in `User.settings` JSON field
- Keys: `quietHoursStart`, `quietHoursEnd`, `enablePush`, `enableBanners`
- Respect quiet hours before triggering

### Optional Features (P2)
- Smart batching (group multiple reminders within 5-min window)
- Sound/vibration preferences
- Reminder categories/priorities
- Integration with system calendar

---

## Technical Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Scheduler checks for due reminders every 30 seconds |
| FR-2 | Reminders trigger within 1 minute of scheduled time |
| FR-3 | Notification banner displays for triggered reminders |
| FR-4 | Users can complete, snooze, or dismiss reminders |
| FR-5 | Recurring reminders reschedule after completion |
| FR-6 | Notification center shows triggered and upcoming reminders |
| FR-7 | Web Push notifications work in background (P1) |
| FR-8 | User can configure notification preferences |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Scheduler must not impact app performance (< 5% CPU) |
| NFR-2 | Notification banner renders within 100ms of trigger |
| NFR-3 | Supports 100+ pending reminders per user |
| NFR-4 | Push notifications deliver within 5 seconds |
| NFR-5 | Graceful degradation if Push API unavailable |

---

## Architecture Design

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  NotificationProvider (Context)                              │
│    ├── useReminders() hook                                   │
│    ├── NotificationBanner component                          │
│    ├── NotificationCenter component                          │
│    └── SnoozeModal component                                 │
├─────────────────────────────────────────────────────────────┤
│  ReminderScheduler (useEffect interval)                      │
│    ├── Poll /api/reminders/check every 30s                   │
│    ├── Trigger notifications for due reminders               │
│    └── Handle Web Push subscription                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (API Routes)                      │
├─────────────────────────────────────────────────────────────┤
│  GET  /api/reminders/check                                   │
│    → Returns due reminders, marks as triggered               │
│  POST /api/reminders/:id/complete                            │
│  POST /api/reminders/:id/snooze                              │
│  POST /api/reminders/:id/dismiss                             │
│  GET  /api/reminders/upcoming                                │
│  PUT  /api/users/settings (notification prefs)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Prisma)                         │
├─────────────────────────────────────────────────────────────┤
│  Reminder table                                              │
│    - status: pending → triggered → completed/dismissed       │
│  User.settings                                               │
│    - quietHoursStart, quietHoursEnd, enablePush              │
│  PushSubscription (new model for P1)                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Reminder Creation**: Note processing extracts reminder → saved to DB with `status: pending`
2. **Scheduler Check**: Frontend polls `/api/reminders/check` every 30s
3. **Trigger**: API finds due reminders, updates `status: triggered`, returns to frontend
4. **Display**: NotificationProvider receives reminders, displays NotificationBanner
5. **Action**: User clicks Complete/Snooze/Dismiss → API updates status
6. **Recurring**: If recurring, create next occurrence with new `triggerAt`

---

## Database Changes

### Existing Schema (No Changes Needed)

The current `Reminder` model supports all required functionality:

```prisma
model Reminder {
  id          String         @id @default(uuid())
  noteId      String
  userId      String
  message     String
  triggerAt   DateTime
  recurring   String?        // cron pattern
  status      ReminderStatus @default(pending)  // pending, triggered, dismissed, completed
  extractedText String?
  type         ReminderType  @default(time)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### New Model (P1 - Web Push)

```prisma
model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  endpoint  String   @unique
  keys      Json     // p256dh, auth
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("push_subscriptions")
}
```

---

## API Endpoints

### GET /api/reminders/check
**Purpose**: Check for due reminders and return them
**Auth**: Required
**Response**:
```json
{
  "reminders": [
    {
      "id": "uuid",
      "message": "Call John",
      "triggerAt": "2026-02-04T14:00:00Z",
      "type": "time",
      "noteId": "uuid",
      "notePreview": "Don't forget to call John about..."
    }
  ]
}
```

### POST /api/reminders/:id/complete
**Purpose**: Mark reminder as completed
**Auth**: Required
**Body**: `{}`
**Side Effects**: If recurring, creates next occurrence

### POST /api/reminders/:id/snooze
**Purpose**: Snooze reminder to new time
**Auth**: Required
**Body**: `{ "duration": "30m" | "1h" | "3h" | "tomorrow" | "custom", "customTime": "ISO8601" }`

### POST /api/reminders/:id/dismiss
**Purpose**: Dismiss reminder (won't trigger again)
**Auth**: Required
**Body**: `{}`

### GET /api/reminders/upcoming
**Purpose**: Get upcoming reminders
**Auth**: Required
**Query**: `?hours=24` (default 24)
**Response**: Array of reminders

---

## UI/UX Specifications

### Notification Banner
- **Position**: Fixed, top center, below header
- **Width**: max 480px
- **Animation**: Slide down, fade in
- **Auto-dismiss**: 30 seconds (configurable)
- **Stack behavior**: Max 3 visible, queue rest

### Notification Center
- **Trigger**: Bell icon in header
- **Badge**: Red dot with count
- **Dropdown width**: 320px
- **Sections**: "New" (triggered), "Upcoming" (next 24h)
- **Empty state**: "No notifications"

### Snooze Options
- Quick buttons: 15 min, 30 min, 1 hour, 3 hours, Tomorrow 9am
- Custom: Date/time picker in modal

---

## Dependencies

### Libraries
- None new required (using existing React, Next.js)
- Optional: `web-push` npm package for P1

### APIs
- Web Push API (browser native) - P1
- Service Worker API (browser native) - P1

### Internal Dependencies
- `@cobrain/database` - reminders repository
- `@cobrain/core` - types

---

## Out of Scope

- Mobile push notifications (requires native apps)
- SMS/Email notifications
- Calendar integration for context-triggered reminders
- Location-based reminders
- Smart assistant integration (Siri, Alexa)

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Browser tab closed = no notifications | High | High | Web Push API (P1), encourage keeping tab open |
| Polling impacts performance | Medium | Medium | Optimize query, use 30s interval, debounce |
| User misses notification banner | Medium | Medium | Notification center as backup, sound option |
| Recurring reminder spam | Low | Medium | Max recurrence limit, easy dismiss |
| Timezone issues | Medium | High | Store all times in UTC, convert on display |

---

## Implementation Plan

### Phase 1: Core Scheduling (P0)
1. Create API endpoints for check/complete/snooze/dismiss
2. Implement NotificationProvider context
3. Build NotificationBanner component
4. Add polling scheduler hook
5. Test with manual reminders

### Phase 2: Notification Center (P0)
1. Build NotificationCenter dropdown component
2. Add bell icon to header
3. Implement upcoming reminders API
4. Add notification history

### Phase 3: Recurring & Polish (P0)
1. Implement recurring reminder logic
2. Add snooze modal with custom time
3. Polish animations and UX
4. Add loading states and error handling

### Phase 4: Web Push (P1)
1. Set up Service Worker
2. Implement push subscription flow
3. Create backend push endpoint
4. Add notification preferences

---

## Appendix

### Research References
- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notification API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Mem AI Heads Up Notifications](https://get.mem.ai/blog/introducing-mem-2-0)

### Competitive Analysis

| Feature | CoBrain (Planned) | Mem AI | Notion | Obsidian |
|---------|-------------------|--------|--------|----------|
| Auto-extracted reminders | Yes | Yes | No | Plugin |
| Time-based triggers | Yes | Yes | Yes | Plugin |
| In-app notifications | Yes | Yes | Yes | Yes |
| Push notifications | P1 | Yes | Yes | No |
| Snooze | Yes | Yes | Yes | Plugin |
| Recurring | Yes | Yes | Yes | Plugin |
| Smart timing | P2 | Yes | No | No |

---

**End of PRD**
