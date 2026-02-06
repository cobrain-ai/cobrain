# PRD: Built-in Local LLM Inference for iOS and Android

**Author**: Product Design Agent
**Date**: 2026-02-06
**Status**: Draft
**GitHub Issue**: #55

---

## Executive Summary

Add built-in on-device LLM inference for iOS and Android, enabling CoBrain's AI features (entity extraction, chat, semantic search) to run entirely on the user's device without requiring external services like Ollama or cloud API keys. This aligns with CoBrain's core philosophy of privacy-first, offline-capable AI.

---

## Problem Statement

CoBrain's current AI architecture has a critical gap on mobile:

- **Ollama requires a desktop/server**: Mobile users cannot run Ollama locally on their phones. The only "local" option requires a desktop machine running Ollama on the same network.
- **Cloud providers need API keys + internet**: OpenAI and Anthropic require paid API keys and constant internet connectivity, creating friction for new users and violating the privacy-first promise.
- **No zero-config AI on mobile**: New mobile users must either set up Ollama on a separate machine or configure cloud API keys before they can use any AI features. This creates a terrible first-run experience.
- **Privacy concerns**: Users who chose CoBrain specifically for its local-first approach are forced to send their personal notes to cloud providers on mobile.

---

## Goals & Objectives

### Primary Goals
- Enable on-device LLM inference on iOS and Android with zero configuration
- Maintain CoBrain's privacy-first architecture — no data leaves the device
- Provide a good first-run experience for mobile users (AI works out of the box after model download)

### Secondary Goals
- Support model management (download, delete, storage info)
- Provide streaming responses for responsive UI
- Integrate seamlessly with existing `@cobrain/core` provider system
- Support multiple model sizes for different device capabilities

### Success Metrics (KPIs)
- 90% of mobile users can run local AI within 5 minutes of first launch
- Average response time < 5 seconds for short entity extraction prompts
- Model download completion rate > 80% (users don't abandon mid-download)
- Zero external API calls when using local provider

---

## User Stories

### US-1: First-time mobile user discovers local AI
- **As a** new CoBrain mobile user
- **I want to** use AI features without creating accounts or configuring servers
- **So that** I can start capturing and organizing notes immediately

**Acceptance Criteria**:
- [ ] Onboarding flow introduces local AI option
- [ ] User can download a recommended model with one tap
- [ ] Download progress is clearly shown with size and time estimates
- [ ] AI features work immediately after model download completes

### US-2: Privacy-conscious user runs AI entirely on-device
- **As a** privacy-conscious user
- **I want** all AI processing to happen on my device
- **So that** my personal notes never leave my phone

**Acceptance Criteria**:
- [ ] No network calls during inference
- [ ] Clear indicator in UI showing "On-device" processing
- [ ] No telemetry or analytics on note content

### US-3: User manages downloaded models
- **As a** user with limited storage
- **I want to** see how much space models use and delete ones I don't need
- **So that** I can manage my device storage effectively

**Acceptance Criteria**:
- [ ] Settings shows list of downloaded models with sizes
- [ ] User can delete any downloaded model
- [ ] Storage usage is shown before and after download
- [ ] Warning shown if device has insufficient storage

### US-4: User gets streaming AI responses
- **As a** user chatting with CoBrain AI
- **I want to** see the AI response appear word-by-word
- **So that** I know the AI is working and don't stare at a loading spinner

**Acceptance Criteria**:
- [ ] Chat responses stream token-by-token
- [ ] Entity extraction shows progress indicator
- [ ] User can cancel generation mid-stream

### US-5: User switches between AI providers
- **As a** user with both local and cloud providers configured
- **I want to** easily switch between on-device and cloud AI
- **So that** I can use cloud AI for complex tasks and local for quick notes

**Acceptance Criteria**:
- [ ] Provider selection in settings works for local LLM
- [ ] Local LLM appears as a provider option alongside Ollama, OpenAI, etc.
- [ ] Active provider clearly shown in UI
- [ ] Automatic fallback to cloud if local model not downloaded

---

## Feature Specifications

### Core Features

#### 1. Platform-Native LLM Inference
- **iOS**: Apple Foundation Models framework (via `@react-native-ai/apple` or `react-native-apple-llm`)
  - Uses Apple Intelligence on-device model (~3B parameters)
  - Zero model download needed on supported devices (iPhone 15 Pro+, M1+ iPads)
  - Streaming, structured output, tool calling support
  - Requires iOS 26+
- **Android**: MediaPipe LLM Inference API (via `expo-llm-mediapipe`)
  - Supports Gemma 3n E2B (2B params), Gemma 2B, Phi-3 Mini
  - Model download required (~1.5-3GB)
  - Streaming token-by-token generation
  - Works on most modern Android devices with 4GB+ RAM
- **Cross-platform fallback**: react-native-executorch
  - Meta's ExecuTorch framework for both platforms
  - Supports Llama 3.2, SmolLM 2, Qwen 3
  - Good for devices not supporting platform-native options

**Priority**: High
**Complexity**: High

#### 2. Model Management System
- Download models from Hugging Face or bundled URLs
- Show download progress (percentage, speed, ETA)
- Pause/resume/cancel downloads
- List downloaded models with sizes
- Delete models to free storage
- Check device compatibility before download

**Priority**: High
**Complexity**: Medium

#### 3. Provider Integration
- New `LocalLLMProvider` extending `BaseProvider` from `@cobrain/core`
- Register as provider type `'local-llm'` in `ProviderType` union
- Support `complete()` and `stream()` methods
- Health check reports model status and device capabilities
- Seamless integration with existing entity extraction pipeline

**Priority**: High
**Complexity**: Medium

#### 4. Settings UI
- Model browser showing available models
- Download/delete buttons for each model
- Storage usage indicator
- Device compatibility info
- Active model selection

**Priority**: Medium
**Complexity**: Medium

### Optional Features (Phase 2)

- **Model fine-tuning**: Adapt model to user's writing style (Apple adapters)
- **Multimodal input**: Image understanding via local vision models
- **Whisper integration**: On-device speech-to-text via ExecuTorch
- **Background processing**: Process notes while app is in background
- **Model recommendations**: Auto-suggest best model for user's device

---

## Technical Requirements

### Functional Requirements
- **REQ-1**: System shall provide on-device LLM inference on iOS 26+ using Apple Foundation Models
- **REQ-2**: System shall provide on-device LLM inference on Android using MediaPipe LLM Inference API
- **REQ-3**: System shall support streaming text generation with token-by-token output
- **REQ-4**: System shall integrate with existing `BaseProvider` abstraction in `@cobrain/core`
- **REQ-5**: System shall support model download, deletion, and storage management
- **REQ-6**: System shall work entirely offline after initial model download
- **REQ-7**: System shall support AbortSignal for cancelling generation
- **REQ-8**: System shall report device compatibility for each model

### Non-Functional Requirements
- **Performance**: First token latency < 2 seconds on mid-range devices
- **Performance**: Sustained generation speed > 5 tokens/second on mid-range devices
- **Storage**: Smallest usable model < 2GB download size
- **Memory**: Peak memory usage < 2GB during inference
- **Battery**: Inference should not drain more than 5% battery per 10 minutes of active use
- **Compatibility**: iOS 26+ (iPhone 15 Pro, 16 series, M1+ iPad/Mac) for Apple Foundation Models
- **Compatibility**: Android 9+ with 4GB+ RAM for MediaPipe
- **Privacy**: Zero network calls during inference
- **UX**: Download progress must update at least every 500ms

---

## Architecture

### Provider Hierarchy

```
BaseProvider (packages/core/src/providers/base.ts)
├── OllamaProvider (existing - desktop local)
├── OpenAIProvider (existing - cloud)
├── AnthropicProvider (existing - cloud)
├── ClaudeCliProvider (existing - desktop local)
└── LocalLLMProvider (NEW - mobile local)
    ├── AppleFoundationProvider (iOS - Apple Intelligence)
    ├── MediaPipeLLMProvider (Android - MediaPipe/Gemma)
    └── ExecuTorchProvider (cross-platform fallback)
```

### Key Files to Create/Modify

```
packages/core/src/
├── types/index.ts              # Add 'local-llm' to ProviderType
├── providers/
│   ├── index.ts                # Export new provider
│   ├── local-llm.ts            # NEW: Platform-dispatching provider
│   ├── local-llm-apple.ts      # NEW: iOS Apple Foundation Models
│   ├── local-llm-mediapipe.ts  # NEW: Android MediaPipe
│   └── local-llm-executorch.ts # NEW: Cross-platform ExecuTorch
│
apps/mobile/
├── package.json                # Add native module deps
├── src/
│   ├── providers/
│   │   └── local-llm-bridge.ts # NEW: React Native bridge
│   ├── screens/
│   │   └── model-manager.tsx   # NEW: Model download/manage UI
│   └── components/
│       ├── model-card.tsx       # NEW: Model info card
│       └── download-progress.tsx # NEW: Download progress bar
```

### Data Flow

```
User Input → Chat/Capture UI
    ↓
LLM Provider (LocalLLMProvider)
    ↓
Platform Detection (iOS vs Android)
    ↓
┌─────────────────┬──────────────────────┐
│ iOS             │ Android              │
│ Apple FM Bridge │ MediaPipe Bridge     │
│ (Native Module) │ (Native Module)      │
└────────┬────────┴──────────┬───────────┘
         ↓                   ↓
   On-Device Model     On-Device Model
   (Apple Intelligence) (Gemma 3n / Phi-3)
         ↓                   ↓
   Streaming Tokens    Streaming Tokens
         ↓                   ↓
         └─────────┬─────────┘
                   ↓
           LLMStreamChunk / LLMResponse
                   ↓
           Entity Extraction / Chat UI
```

---

## Dependencies

### npm packages (new)
- `expo-llm-mediapipe` or `react-native-llm-mediapipe` — MediaPipe LLM for Android
- `react-native-apple-llm` or `@react-native-ai/apple` — Apple Foundation Models for iOS
- `react-native-executorch` — Cross-platform fallback (optional Phase 2)

### Native Requirements
- **iOS**: Xcode 26+, iOS 26 SDK, Apple Intelligence-capable device
- **Android**: MediaPipe LLM Inference API, NDK for native binaries
- **Both**: Expo development build (not Expo Go — native modules required)

### Internal Dependencies
- `@cobrain/core` — BaseProvider, types, provider registry
- `@cobrain/ai` — Entity extraction pipeline integration
- `@cobrain/database` — Store model metadata and download state

---

## Out of Scope (Phase 1)

- Custom model training or fine-tuning
- Desktop local LLM (already covered by Ollama)
- Web browser local LLM (limited WebGPU support)
- Multimodal (image/audio) processing via local models
- Model quantization or conversion tools
- Serving models to other devices on network

---

## Competitive Analysis

| Feature | CoBrain (Planned) | Notion | Obsidian | Apple Notes |
|---------|-------------------|--------|----------|-------------|
| On-device LLM (iOS) | ✅ Apple FM | ❌ Cloud only | ⏳ Plugins | ✅ Apple Intelligence |
| On-device LLM (Android) | ✅ MediaPipe | ❌ Cloud only | ⏳ Plugins | N/A |
| Model Management | ✅ | N/A | ⏳ | ❌ (Built-in) |
| Streaming Responses | ✅ | ✅ | ✅ | ✅ |
| Zero-config AI | ✅ (iOS) | ❌ (needs account) | ❌ (needs setup) | ✅ |
| Privacy (no cloud) | ✅ | ❌ | ✅ (with plugins) | ✅ |
| Entity Extraction | ✅ | ❌ | ❌ | ❌ |
| Knowledge Graph | ✅ | ❌ | ✅ (Graph view) | ❌ |

### Key Differentiators
- **CoBrain is the only open-source note app with built-in on-device LLM on both iOS AND Android**
- Apple Notes has Apple Intelligence but no Android, no entity extraction, no knowledge graph
- Obsidian requires manual plugin setup for any AI features
- Notion is entirely cloud-based

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Apple FM framework still in preview (iOS 26 not yet released) | Medium | High | Use react-native-apple-llm which tracks FM releases; support ExecuTorch as iOS fallback |
| Model download size scares users (1.5-3GB) | Medium | Medium | Clear size indication before download; offer smallest model first; progressive download |
| Poor performance on low-end devices | Medium | Medium | Device capability check before model selection; recommend appropriate model size |
| MediaPipe API changes or deprecation | Low | High | Abstract behind provider interface; ExecuTorch as fallback |
| Expo compatibility issues with native modules | Medium | Medium | Use Expo development builds; test on EAS Build |
| Battery drain during inference | Medium | Medium | Implement inference timeout; batch processing; background limits |

---

## Timeline Estimate

- **Phase 1 (Core)**: Design + Implementation + Testing
  - Provider architecture & types: 1 day
  - iOS Apple FM integration: 2 days
  - Android MediaPipe integration: 2 days
  - Model management system: 2 days
  - Settings UI: 1 day
  - Testing: 2 days

- **Phase 2 (Enhancement)**: ExecuTorch fallback, multimodal, Whisper
  - Future sprint

---

## Appendix

### Research References
- [React Native ExecuTorch](https://docs.swmansion.com/react-native-executorch/) — Meta's on-device AI for React Native
- [expo-llm-mediapipe](https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe) — MediaPipe LLM for Expo
- [react-native-apple-llm](https://github.com/deveix/react-native-apple-llm) — Apple Foundation Models for RN
- [@react-native-ai/apple](https://www.npmjs.com/package/@react-native-ai/apple) — Callstack's Apple AI for RN
- [MediaPipe LLM Inference API](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference) — Google's on-device LLM API
- [Apple Foundation Models Framework](https://developer.apple.com/documentation/foundationmodels) — Apple's on-device AI framework
- [Gemma 3n](https://ai.google.dev/gemma) — Google's efficient on-device model family
