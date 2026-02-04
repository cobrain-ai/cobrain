# PRD: Desktop App with Tauri

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented (Foundation)
**GitHub Issue**: #43

---

## Executive Summary

Create a native desktop application using Tauri v2 that wraps the Next.js web app with additional desktop-specific features like system tray, global keyboard shortcuts, and native notifications.

---

## Problem Statement

Web-only users face limitations:
- Must keep browser open to receive reminders
- No system-level quick capture shortcut
- Limited integration with desktop workflows
- Context switching between browser and other apps

---

## Goals & Objectives

| Goal | Metric |
|------|--------|
| Native feel | Startup time < 3 seconds |
| System integration | Tray icon always accessible |
| Quick capture | Global shortcut works from any app |
| Cross-platform | Works on Windows, macOS, Linux |

---

## Features Planned

### P0 - MVP Desktop

1. **Tauri Shell**
   - Embed Next.js as frontend
   - Native window management
   - Auto-updates via Tauri updater

2. **System Tray**
   - Tray icon with menu
   - Quick capture option
   - Open main window
   - Quit application

3. **Global Keyboard Shortcut**
   - `Ctrl+Shift+Space` (configurable)
   - Opens quick capture window
   - Works from any application

4. **Native Notifications**
   - System-level reminder notifications
   - Click to open app
   - Action buttons (Complete, Snooze)

### P1 - Enhanced Desktop

5. **Auto-Launch on Startup**
   - Optional setting
   - Start minimized to tray

6. **Offline Mode**
   - Local SQLite database
   - Sync when online

7. **Menu Bar Integration (macOS)**
   - Menu bar app option
   - Quick access to recent notes

---

## Technical Architecture

```
apps/
└── desktop/
    ├── src-tauri/
    │   ├── Cargo.toml
    │   ├── tauri.conf.json
    │   ├── src/
    │   │   ├── main.rs
    │   │   ├── tray.rs
    │   │   └── shortcuts.rs
    │   └── icons/
    ├── package.json
    └── README.md
```

### Technology Stack

- **Tauri v2** - Rust-based desktop framework
- **Next.js** - Frontend (served locally or bundled)
- **SQLite** - Local database (via Prisma)
- **Rust** - Native functionality

---

## Implementation Plan

### Phase 1: Project Setup
- Initialize Tauri v2 project
- Configure build for Windows/macOS/Linux
- Integrate with existing Next.js app

### Phase 2: Core Features
- System tray implementation
- Global shortcut registration
- Native notification bridge

### Phase 3: Polish
- Auto-updates
- Auto-launch option
- Installer configurations

---

## Out of Scope (This Release)

- Mobile apps (separate project)
- Browser extension (already implemented)
- Cloud sync (future feature)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tauri learning curve | Medium | Use examples and docs |
| Platform differences | High | Test on all platforms |
| Build complexity | Medium | CI/CD for releases |

---

**End of PRD**
