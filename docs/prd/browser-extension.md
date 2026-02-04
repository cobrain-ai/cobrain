# PRD: Browser Extension for Quick Capture

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**GitHub Issue**: #39

---

## Executive Summary

A Chrome browser extension that enables users to capture notes, selected text, and web content directly to CoBrain without leaving the current page.

---

## Problem Statement

Users frequently encounter information while browsing that they want to save to CoBrain. Currently they must:
1. Copy the content
2. Navigate to CoBrain
3. Create a new note
4. Paste the content

This friction reduces capture frequency and leads to lost information.

---

## Solution

A lightweight browser extension with:
- One-click capture popup
- Keyboard shortcut for power users
- Right-click context menu integration
- Automatic source URL attribution

---

## Features Implemented

### Core Features
1. **Popup Interface** (`popup.html`, `popup.js`)
   - Connection status indicator
   - Text capture form
   - Quick actions (Capture Selection, Capture Page)
   - Recent captures list

2. **Background Service Worker** (`background.js`)
   - Keyboard shortcut handling (`Ctrl+Shift+C`)
   - Context menu integration
   - Quick capture without popup
   - Authentication checking

3. **Content Script** (`content.js`, `content.css`)
   - In-page capture overlay
   - Selection capture
   - Page content extraction
   - Dark mode support

4. **Context Menu Options**
   - Capture selected text
   - Capture link
   - Capture image

### Technical Details
- Chrome Manifest V3
- Service worker architecture
- Cross-origin authentication via credentials
- Local storage for recent captures

---

## Files Created

- `apps/browser-extension/manifest.json` - Extension manifest
- `apps/browser-extension/popup.html` - Popup UI
- `apps/browser-extension/popup.js` - Popup logic
- `apps/browser-extension/background.js` - Service worker
- `apps/browser-extension/content.js` - Content script
- `apps/browser-extension/content.css` - Content styles
- `apps/browser-extension/icons/*.svg` - Icon sources
- `apps/browser-extension/README.md` - Documentation

---

## Installation

1. Navigate to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `apps/browser-extension` folder

---

## Future Enhancements

- Firefox/Safari support
- Image/screenshot capture
- Tag suggestions based on content
- Offline queue with sync
- Chrome Web Store distribution

---

**End of PRD**
