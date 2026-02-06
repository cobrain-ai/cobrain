# Design Specification: Local LLM Mobile UI

**Feature**: Built-in Local LLM for iOS & Android
**Date**: 2026-02-06
**Style**: Follows existing CoBrain mobile design system (NativeWind/Tailwind)

---

## User Flows

### Flow 1: First-Time Setup (from Settings)

```
[Settings Screen]
    ↓
[Tap "AI Settings"]
    ↓
[AI Settings Screen]
    ├── Provider selection (radio-style cards)
    │   ├── "On-Device AI" (local-llm) ← NEW
    │   ├── "Ollama" (requires server)
    │   ├── "OpenAI" (requires API key)
    │   └── "Anthropic" (requires API key)
    ↓
[Select "On-Device AI"]
    ↓
[Platform-specific flow]
    ├── iOS (Apple Intelligence available):
    │   └── "Ready to use" → Done (no download needed)
    ├── iOS (Apple Intelligence unavailable):
    │   └── Show model list → Download model → Ready
    └── Android:
        └── Show model list → Download model → Ready
```

### Flow 2: Model Management

```
[AI Settings Screen]
    ↓
[Tap "Manage Models"]
    ↓
[Model Manager Screen]
    ├── Downloaded Models section
    │   ├── Model card with size, status
    │   ├── "Active" badge on selected model
    │   └── Swipe/tap to delete
    └── Available Models section
        ├── Model card with size, description
        └── Download button with progress
```

---

## Screen Designs

### 1. AI Settings Screen (`/ai-settings`)

**Layout**: ScrollView with SettingSection groups

```
┌─────────────────────────────┐
│ ← AI Settings               │
├─────────────────────────────┤
│                             │
│ PROVIDER                    │
│ ┌─────────────────────────┐ │
│ │ ◉ On-Device AI          │ │
│ │   Private · No internet │ │
│ │   ✓ Ready (iOS) or      │ │
│ │   "1 model downloaded"  │ │
│ ├─────────────────────────┤ │
│ │ ○ Ollama                │ │
│ │   Local server required │ │
│ ├─────────────────────────┤ │
│ │ ○ OpenAI                │ │
│ │   API key required      │ │
│ ├─────────────────────────┤ │
│ │ ○ Anthropic             │ │
│ │   API key required      │ │
│ └─────────────────────────┘ │
│                             │
│ ON-DEVICE MODELS            │
│ ┌─────────────────────────┐ │
│ │ 🤖 Manage Models        │ │
│ │   1 downloaded · 1.5 GB │ │
│ └─────────────────────────┘ │
│                             │
│ STATUS                      │
│ ┌─────────────────────────┐ │
│ │ Provider: On-Device AI  │ │
│ │ Model: Gemma 3n E2B     │ │
│ │ Status: ● Ready         │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### 2. Model Manager Screen (`/model-manager`)

```
┌─────────────────────────────┐
│ ← Model Manager             │
├─────────────────────────────┤
│                             │
│ DOWNLOADED                  │
│ ┌─────────────────────────┐ │
│ │ Gemma 3n E2B      ✓    │ │
│ │ 2B params · 1.5 GB     │ │
│ │ Fast · Good quality     │ │
│ │            [Delete]     │ │
│ └─────────────────────────┘ │
│                             │
│ AVAILABLE                   │
│ ┌─────────────────────────┐ │
│ │ Phi-3 Mini              │ │
│ │ 3.8B params · 2.3 GB   │ │
│ │ Slower · Better quality │ │
│ │         [Download]      │ │
│ ├─────────────────────────┤ │
│ │ SmolLM 2 360M           │ │
│ │ 360M params · 720 MB   │ │
│ │ Very fast · Basic       │ │
│ │         [Download]      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Downloading...          │ │
│ │ ████████░░ 78%          │ │
│ │ 1.2 GB / 1.5 GB        │ │
│ │           [Cancel]      │ │
│ └─────────────────────────┘ │
│                             │
│ Storage: 1.5 GB used       │
│                             │
└─────────────────────────────┘
```

---

## Component Specifications

### ProviderCard
- Radio-style selection card
- Icon + Name + Description + Status badge
- Active state: blue left border + checkmark
- Uses existing SettingItem pattern

### ModelCard
- Model name (bold) + parameter count + size
- Quality/speed description
- Download button (available) or Delete button (downloaded)
- Active badge if currently selected
- Download progress bar when downloading

### DownloadProgress
- Animated progress bar (blue fill)
- Percentage + downloaded/total size text
- Cancel button
- Uses react-native-reanimated for smooth animation

---

## Color Usage (existing palette)

- Active/selected: `#2563eb` (primary blue)
- Success/ready: `#10b981` (green)
- Warning/downloading: `#f59e0b` (amber)
- Delete/error: `#ef4444` (red)
- Surface dark: `bg-slate-900`
- Surface light: `bg-white`
- Text: existing dark/light scheme
