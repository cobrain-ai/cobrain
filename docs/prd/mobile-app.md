# PRD: Mobile App with React Native

**Author**: Product Design Agent
**Date**: 2026-02-05
**Status**: Draft
**GitHub Issue**: #48

---

## Executive Summary

CoBrain Mobile is a React Native application built with Expo that brings the full CoBrain AI-powered note-taking experience to iOS and Android devices. The mobile app provides quick capture capabilities, voice input, conversational AI queries, and proactive notifications—enabling users to capture thoughts on-the-go and access their knowledge graph from anywhere.

---

## Problem Statement

Current desktop-only CoBrain limitations:

- **Capture Friction:** Ideas often come when users are away from computers (commuting, walking, meetings)
- **Context Loss:** By the time users reach their desktop, important details are forgotten
- **Notification Reach:** Proactive reminders only reach users when desktop app is open
- **Query Accessibility:** Users can't quickly ask "What do I need at the store?" while shopping
- **Sync Dependency:** No offline capture means ideas are lost without connectivity

---

## Goals & Objectives

### Primary Goals
- Seamless mobile capture with sub-2-second activation
- Full conversational AI interface on mobile
- Real-time sync with desktop via cr-sqlite
- Native push notifications for proactive reminders

### Success Metrics (KPIs)
| Metric | Target |
|--------|--------|
| Mobile DAU | 40% of total DAU |
| Mobile captures per user/day | 5+ |
| Quick capture time | < 2 seconds from lock screen |
| Sync latency | < 5 seconds |
| App store rating | 4.5+ stars |

---

## User Stories

### US-M-1: Quick Voice Capture
- As a user on-the-go
- I want to voice-record notes while walking
- So that I can capture thoughts hands-free

**Acceptance Criteria**:
- [ ] Voice button accessible from main screen
- [ ] Real-time transcription displayed
- [ ] Works offline with sync when connected
- [ ] Background audio recording supported

### US-M-2: Widget Quick Capture
- As a busy user
- I want to capture notes from home screen widget
- So that I don't need to open the full app

**Acceptance Criteria**:
- [ ] iOS widget with text input
- [ ] Android widget with voice and text
- [ ] Single-tap to open capture screen
- [ ] Note saved without app interaction

### US-M-3: Conversational Queries
- As a shopper
- I want to ask "What's on my shopping list?" from my phone
- So that I can see items while at the store

**Acceptance Criteria**:
- [ ] Chat interface with AI responses
- [ ] Voice query support
- [ ] Results show source notes
- [ ] Response time < 3 seconds

### US-M-4: Push Notifications
- As a medication user
- I want to receive reminder notifications on my phone
- So that I never miss taking my medication

**Acceptance Criteria**:
- [ ] Native push notifications
- [ ] Actionable notifications (dismiss, snooze)
- [ ] Smart timing respects Do Not Disturb
- [ ] Deep links to relevant notes

### US-M-5: Offline Support
- As a traveler
- I want to capture notes while offline
- So that ideas aren't lost without connectivity

**Acceptance Criteria**:
- [ ] Full note capture offline
- [ ] Local AI processing option (via Ollama)
- [ ] Automatic sync when connected
- [ ] Conflict resolution for concurrent edits

### US-M-6: Multi-Device Sync
- As a multi-device user
- I want my notes synced across phone, tablet, and desktop
- So that I have consistent data everywhere

**Acceptance Criteria**:
- [ ] Real-time sync via WebSocket
- [ ] CRDT-based conflict resolution
- [ ] Sync status indicator
- [ ] Manual sync trigger option

---

## Feature Specifications

### Core Features (P0 - Must Have)

#### 1. Quick Capture
- **Description:** Rapid note input from anywhere
- **Components:**
  - Floating action button (FAB) for instant capture
  - Voice input with real-time transcription
  - Text input with keyboard suggestions
  - Image capture with OCR (future)
- **Priority:** P0
- **Complexity:** Medium

#### 2. Conversational Interface
- **Description:** Chat-based AI interaction
- **Components:**
  - Message-style chat UI
  - Voice query input
  - Streaming AI responses
  - Source note references
- **Priority:** P0
- **Complexity:** High

#### 3. Push Notifications
- **Description:** Proactive reminders via native notifications
- **Components:**
  - Firebase Cloud Messaging (FCM) for Android
  - APNs for iOS
  - Expo Push Notifications service
  - Notification scheduling
- **Priority:** P0
- **Complexity:** Medium

#### 4. Offline-First Data
- **Description:** Full functionality without internet
- **Components:**
  - SQLite local database
  - cr-sqlite CRDT sync
  - Offline queue management
  - Sync status UI
- **Priority:** P0
- **Complexity:** High

### Secondary Features (P1 - Should Have)

#### 5. Home Screen Widgets
- **Description:** Quick access from home screen
- **Components:**
  - iOS WidgetKit integration
  - Android App Widgets
  - Recent notes display
  - Quick capture input
- **Priority:** P1
- **Complexity:** High

#### 6. Share Extension
- **Description:** Capture from other apps
- **Components:**
  - iOS Share Extension
  - Android Share Intent
  - URL/text/image capture
  - Auto-extraction of metadata
- **Priority:** P1
- **Complexity:** Medium

#### 7. Note Browser
- **Description:** Browse and search existing notes
- **Components:**
  - Infinite scroll list
  - Full-text search
  - Filter by date/entity
  - Note detail view
- **Priority:** P1
- **Complexity:** Medium

### Future Features (P2 - Nice to Have)

#### 8. Graph Visualization
- **Description:** Visual knowledge graph on mobile
- **Complexity:** Very High

#### 9. Watch App
- **Description:** Quick capture on Apple Watch/Wear OS
- **Complexity:** Very High

---

## Technical Requirements

### Platform Requirements
| Requirement | Specification |
|-------------|---------------|
| iOS Version | 15.0+ |
| Android API | Level 26+ (Android 8.0) |
| React Native | 0.76+ |
| Expo SDK | 52+ |
| TypeScript | 5.3+ |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Screens   │  │ Components  │  │    Navigation       │  │
│  │  - Home     │  │ - NoteCard  │  │  (expo-router)      │  │
│  │  - Chat     │  │ - VoiceBtn  │  │                     │  │
│  │  - Notes    │  │ - FAB       │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │                    State Layer                         │  │
│  │  - Zustand (UI state)                                  │  │
│  │  - React Query (server state)                          │  │
│  │  - @cobrain/sync (CRDT sync)                           │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │                    Data Layer                          │  │
│  │  - @cobrain/database (SQLite + Drizzle)                │  │
│  │  - expo-sqlite (native SQLite)                         │  │
│  │  - cr-sqlite (CRDT extension)                          │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼─────────────────────────────┐  │
│  │                    AI Layer                            │  │
│  │  - @cobrain/core (LLM abstraction)                     │  │
│  │  - Remote API (cloud mode)                             │  │
│  │  - On-device inference (future)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-M-1 | App shall launch to capture screen in < 1.5 seconds (cold start) |
| FR-M-2 | Voice transcription shall begin within 500ms of button press |
| FR-M-3 | Notes shall be saved locally within 100ms |
| FR-M-4 | Sync shall complete within 5 seconds of connectivity restoration |
| FR-M-5 | Chat responses shall begin streaming within 2 seconds |
| FR-M-6 | Push notifications shall deliver within 30 seconds of schedule |
| FR-M-7 | App shall function fully offline (except cloud AI) |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-M-1 | App bundle size < 50MB |
| NFR-M-2 | Memory usage < 200MB typical |
| NFR-M-3 | Battery impact < 3% per hour active use |
| NFR-M-4 | 99% crash-free sessions |
| NFR-M-5 | WCAG 2.1 AA accessibility |
| NFR-M-6 | Support screen readers (VoiceOver, TalkBack) |

---

## Dependencies

### Internal Packages
- `@cobrain/database` - Drizzle ORM, SQLite schema
- `@cobrain/core` - LLM provider abstraction
- `@cobrain/sync` - cr-sqlite sync engine

### External Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| expo | Development framework | ^52.0.0 |
| expo-router | File-based navigation | ^4.0.0 |
| expo-sqlite | Native SQLite | ^15.0.0 |
| expo-notifications | Push notifications | ^0.29.0 |
| expo-speech | Text-to-speech | ^13.0.0 |
| @react-native-voice/voice | Voice recognition | ^3.3.0 |
| zustand | State management | ^5.0.0 |
| @tanstack/react-query | Server state | ^5.0.0 |
| react-native-reanimated | Animations | ^3.16.0 |
| nativewind | Tailwind for RN | ^4.1.0 |

### Services
- Expo Application Services (EAS) for builds
- Expo Push Notification Service
- Firebase Cloud Messaging (Android)
- Apple Push Notification Service (iOS)

---

## Out of Scope (V1)

- Apple Watch / Wear OS companion app
- On-device LLM inference (requires MLKit/CoreML integration)
- Biometric authentication (planned for V1.1)
- Tablet-optimized layouts
- Background sync daemon
- AR note visualization

---

## Competitive Analysis

| Feature | CoBrain | Mem | Notion | Obsidian |
|---------|---------|-----|--------|----------|
| Quick Voice Capture | ✅ Planned | ✅ | ❌ | ❌ |
| AI Chat Interface | ✅ Planned | ✅ | ⚠️ Limited | ❌ |
| Offline-First | ✅ Planned | ⚠️ Partial | ❌ | ✅ |
| CRDT Sync | ✅ Planned | ❌ | ❌ | ⚠️ Plugin |
| Home Widgets | ✅ Planned | ❌ | ❌ | ❌ |
| Push Reminders | ✅ Planned | ✅ | ⚠️ Basic | ❌ |
| Share Extension | ✅ Planned | ✅ | ✅ | ⚠️ Plugin |

**Key Differentiators:**
1. True offline-first with CRDT sync (cr-sqlite)
2. Full AI conversational interface on mobile
3. Quick capture widgets for both platforms
4. Zero-organization philosophy maintained on mobile

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| cr-sqlite RN compatibility | Medium | High | Test early with expo-sqlite, have fallback sync |
| Voice recognition accuracy | Medium | Medium | Use Whisper API as fallback |
| Push notification delivery | Low | High | Implement in-app notification fallback |
| Large bundle size | Medium | Medium | Enable Hermes, tree-shake aggressively |
| Battery drain from sync | Medium | High | Implement intelligent sync batching |
| App store rejection | Low | High | Follow platform guidelines strictly |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Expo project setup with TypeScript
- [ ] Integrate @cobrain/database with expo-sqlite
- [ ] Basic navigation structure (expo-router)
- [ ] Core capture screen with text input

### Phase 2: AI Integration (Week 3-4)
- [ ] Integrate @cobrain/core for chat
- [ ] Chat screen with streaming responses
- [ ] Voice input integration
- [ ] Entity extraction on mobile

### Phase 3: Sync & Offline (Week 5-6)
- [ ] Integrate @cobrain/sync
- [ ] Implement offline queue
- [ ] Conflict resolution UI
- [ ] Sync status indicators

### Phase 4: Notifications (Week 7-8)
- [ ] Push notification setup
- [ ] Reminder scheduling
- [ ] Notification actions
- [ ] Deep linking

### Phase 5: Polish & Widgets (Week 9-10)
- [ ] iOS widget development
- [ ] Android widget development
- [ ] Share extension
- [ ] Performance optimization

### Phase 6: Launch (Week 11-12)
- [ ] Beta testing via TestFlight/Play Console
- [ ] App store submissions
- [ ] Launch marketing
- [ ] Post-launch monitoring

---

## Appendix

### Design References
- Apple Human Interface Guidelines
- Material Design 3 Guidelines
- Expo SDK Documentation
- React Native Best Practices

### API Endpoints Required
- `POST /api/sync` - CRDT sync endpoint
- `POST /api/chat` - AI conversation endpoint
- `POST /api/push/register` - Push token registration
- `GET /api/notes` - Note retrieval
- `POST /api/notes` - Note creation

---

**End of PRD**
