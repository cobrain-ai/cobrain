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

## Text-to-Speech (TTS) - Implemented

**Status**: Implemented (Issue #45)
**Commit**: 3c541c9

### Features Implemented
1. **TTS Controls** (`components/chat/tts-controls.tsx`)
   - Toggle voice responses on/off
   - Playback controls (pause, resume, stop)
   - Settings dropdown for customization

2. **Voice Settings**
   - Rate control (0.5x - 2x)
   - Pitch control (0.5 - 1.5)
   - Volume control (0 - 100%)
   - Browser voice selection
   - Auto-read toggle for new responses

3. **Integration**
   - Integrated into chat page header
   - Uses Web Speech API (SpeechSynthesis)
   - Settings persisted to localStorage

### Files
- `apps/web/src/hooks/use-text-to-speech.ts` - Core TTS hook
- `apps/web/src/components/chat/tts-controls.tsx` - UI controls
- `apps/web/src/app/(app)/chat/page.tsx` - Integration

---

## Image OCR - Implemented

**Status**: Implemented (Issue #45)
**Commit**: 3c541c9

### Features Implemented
1. **Image Upload** (`components/capture/image-ocr.tsx`)
   - Drag-and-drop support
   - File browser button
   - Image preview

2. **OCR Processing**
   - Uses Tesseract.js for client-side OCR
   - Real-time progress tracking
   - Confidence score display
   - Processing time display

3. **Memory Management**
   - Cleanup on component unmount
   - Worker termination
   - Object URL revocation

### Files
- `apps/web/src/hooks/use-image-ocr.ts` - Tesseract.js integration
- `apps/web/src/components/capture/image-ocr.tsx` - UI component
- `apps/web/src/app/(app)/capture/page.tsx` - Integration

---

## Future Enhancements (P2)

- [ ] Language selection dropdown
- [ ] On-device recognition (offline)
- [ ] Voice commands ("save note", "cancel")
- [ ] Audio waveform visualization
- [ ] Multiple language support
- [ ] Multiple image OCR languages

---

**End of PRD**
