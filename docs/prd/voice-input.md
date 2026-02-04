# PRD: Voice Input & Transcription

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**GitHub Issue**: #40

---

## Executive Summary

Voice input capability for hands-free note capture using the Web Speech API for real-time transcription.

---

## Problem Statement

Users need to capture thoughts quickly without typing, especially when:
- On-the-go (walking, driving)
- Hands are occupied
- Faster than typing for stream-of-consciousness capture

---

## Implementation Status

**FULLY IMPLEMENTED** - The voice input feature was already built as part of the core MVP.

---

## Features Implemented

### Core Features
1. **Voice Recording Button** (`components/capture/voice-input.tsx`)
   - One-click start/stop recording
   - Visual recording indicator with pulse animation
   - Cancel button to discard recording

2. **Real-Time Transcription**
   - Uses Web Speech API (SpeechRecognition)
   - Shows interim results in gray, final in black
   - Continuous mode for long-form capture

3. **Transcript Handling**
   - Live preview while recording
   - Auto-submits to parent component on stop
   - Editable in text input before saving
   - Pending transcript state with Save/Discard options

4. **Browser Support**
   - Chrome, Edge, Safari (WebKit)
   - Graceful fallback message for unsupported browsers
   - Firefox has limited support (cloud recognition)

5. **Auto-Stop**
   - Stops automatically after 5 seconds of silence
   - Prevents runaway recording sessions

### Integration Points
- Capture page (`/capture`) integrates VoiceInput component
- Transcripts populate the text input for editing
- Notes saved with `source: 'voice'` tag
- Recent notes show voice icon for voice-captured content

---

## Technical Details

### Web Speech API Configuration
```typescript
recognition.continuous = true        // Keep listening
recognition.interimResults = true    // Show real-time text
recognition.lang = 'en-US'          // Default language
```

### Error Handling
- `not-allowed`: Microphone permission denied
- `aborted`: User cancelled
- Network errors for cloud recognition

---

## Files

- `apps/web/src/components/capture/voice-input.tsx` - Core component
- `apps/web/src/components/capture/index.ts` - Exports
- `apps/web/src/app/(app)/capture/page.tsx` - Integration

---

## Future Enhancements (P2)

- [ ] Language selection dropdown
- [ ] On-device recognition (offline)
- [ ] Voice commands ("save note", "cancel")
- [ ] Audio waveform visualization
- [ ] Multiple language support

---

**End of PRD**
