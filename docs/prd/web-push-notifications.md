# PRD: Web Push Notifications

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**GitHub Issue**: #41

---

## Executive Summary

Add Web Push Notifications support for reminder alerts that work even when the browser tab is not active or closed. This enables CoBrain to truly function as a proactive assistant that reminds users of commitments at the right time.

---

## Problem Statement

Current notification system limitations:
- In-app notifications only work when the tab is open
- Users miss important reminders when browsing other tabs
- No alerts when browser is minimized or closed
- Reliance on users to check the app frequently

---

## Goals & Objectives

| Goal | Metric |
|------|--------|
| Notifications reach users | 90%+ delivery rate |
| User engagement | 30%+ click-through rate |
| Permission acceptance | 50%+ of prompted users |
| No annoyance | <5% opt-out rate after 30 days |

---

## User Stories

### US-1: Enable Push Notifications
- As a user, I want to enable push notifications
- So that I receive reminders even when not on the CoBrain tab

**Acceptance Criteria:**
- [ ] Settings page shows push notification toggle
- [ ] Permission request appears when toggling on
- [ ] Clear explanation of what notifications will be sent
- [ ] Success confirmation after enabling

### US-2: Receive Reminder Notification
- As a user with a pending reminder
- I want to receive a browser notification when it's due
- So that I don't miss important commitments

**Acceptance Criteria:**
- [ ] Notification shows reminder title/content
- [ ] Notification appears even with tab closed
- [ ] Clicking notification opens the note
- [ ] Works on desktop Chrome, Firefox, Edge

### US-3: Manage Notification Preferences
- As a user, I want to configure notification settings
- So that I'm not interrupted during focus time

**Acceptance Criteria:**
- [ ] Enable/disable all push notifications
- [ ] Set quiet hours (e.g., 10pm-8am)
- [ ] Choose notification sound (or silent)

### US-4: Act on Notification
- As a user viewing a notification
- I want quick action buttons
- So that I can respond without opening the app

**Acceptance Criteria:**
- [ ] "Complete" button marks reminder done
- [ ] "Snooze" button delays by 1 hour
- [ ] "View" button opens the note

---

## Technical Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Service Worker for push notification handling |
| FR-2 | VAPID key pair generation and storage |
| FR-3 | Push subscription management API |
| FR-4 | Notification trigger from reminder check API |
| FR-5 | Notification click handlers with deep linking |
| FR-6 | Action buttons (Complete, Snooze, View) |
| FR-7 | Quiet hours configuration |
| FR-8 | Badge count on favicon |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Notifications delivered within 5 seconds of trigger |
| NFR-2 | Support Chrome, Edge, Firefox on desktop |
| NFR-3 | Graceful degradation on Safari (limited support) |
| NFR-4 | HTTPS required (localhost exempt for dev) |

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Next.js App  │  │Service Worker│  │ Notification │       │
│  │ (Frontend)   │──│  (sw.js)     │──│    API       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 ▲                                  │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
          ▼                 │ Push
┌─────────────────┐   ┌─────┴───────┐
│  Next.js API    │   │ Push Service│
│  /api/push/*    │──▶│ (Web Push)  │
└─────────────────┘   └─────────────┘
```

### Files to Create

1. **Service Worker**
   - `apps/web/public/sw.js` - Push event handling

2. **API Endpoints**
   - `apps/web/src/app/api/push/subscribe/route.ts` - Save subscription
   - `apps/web/src/app/api/push/unsubscribe/route.ts` - Remove subscription
   - `apps/web/src/app/api/push/send/route.ts` - Trigger notification

3. **UI Components**
   - `apps/web/src/components/settings/push-settings.tsx` - Settings UI
   - `apps/web/src/hooks/use-push-notifications.ts` - React hook

4. **Database Schema**
   - Add `PushSubscription` model to Prisma schema

### Dependencies

- `web-push` - Node.js library for sending push notifications
- No frontend dependencies (uses native browser APIs)

---

## Security Considerations

- [ ] VAPID keys stored as environment variables
- [ ] Subscription endpoints validated on save
- [ ] Rate limiting on push send endpoint
- [ ] User can only subscribe their own sessions
- [ ] HTTPS enforced in production

---

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full | Primary target |
| Edge | ✅ Full | Chromium-based |
| Firefox | ✅ Full | Native support |
| Safari | ⚠️ Partial | macOS Sonoma+ only |

---

## Out of Scope

- Mobile push notifications (requires native app)
- Email notifications
- SMS notifications
- Slack/Discord integrations

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users deny permission | High | Medium | Clear value proposition, don't ask immediately |
| Push service unavailable | Low | Medium | Fallback to in-app notifications |
| Notification fatigue | Medium | High | Smart batching, quiet hours, user control |

---

## Implementation Phases

**Phase 1: Core Infrastructure**
- Service Worker setup
- VAPID key generation
- Subscription management API

**Phase 2: Notification Sending**
- Push send API
- Integration with reminder checker
- Basic notification display

**Phase 3: User Experience**
- Settings UI
- Action buttons
- Quiet hours

---

**End of PRD**
