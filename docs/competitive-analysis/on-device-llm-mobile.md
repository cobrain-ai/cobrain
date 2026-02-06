# Competitive Analysis: On-Device LLM for Mobile

**Analyzed Solutions**: react-native-executorch, expo-llm-mediapipe, react-native-apple-llm, @react-native-ai/apple
**Analysis Date**: 2026-02-06

---

## Summary

The React Native ecosystem has rapidly matured for on-device LLM inference in 2025-2026. Three main approaches exist: Apple Foundation Models (iOS-only, zero download), MediaPipe LLM Inference (cross-platform, Google models), and ExecuTorch (cross-platform, Meta models). Our recommendation is a hybrid approach using Apple FM on iOS and MediaPipe on Android.

---

## Solution Comparison

| Criteria | react-native-executorch | expo-llm-mediapipe | react-native-apple-llm | @react-native-ai/apple |
|----------|------------------------|-------------------|----------------------|----------------------|
| **Maintainer** | Software Mansion | Community | Community | Callstack |
| **Backend** | Meta ExecuTorch | Google MediaPipe | Apple Foundation Models | Apple Foundation Models |
| **iOS Support** | ✅ | ✅ | ✅ | ✅ |
| **Android Support** | ✅ | ✅ | ❌ | ❌ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ |
| **Model Download** | Required (~1-3GB) | Required (~1-3GB) | ❌ Not needed | ❌ Not needed |
| **Expo Compatible** | ✅ (dev build) | ✅ (dev build) | ✅ (dev build) | ✅ (dev build) |
| **Maturity** | Active (v0.5+) | Early | Early | Preview |
| **Models** | Llama 3.2, SmolLM 2, Qwen 3 | Gemma 3n, Gemma 2B, Phi-3 | Apple Intelligence (~3B) | Apple Intelligence (~3B) |
| **Min iOS** | iOS 15+ | iOS 15+ | iOS 26 | iOS 26 |
| **Min Android** | Android 9+ | Android 9+ | N/A | N/A |
| **RAM Required** | 2-4GB | 2-4GB | Built into OS | Built into OS |
| **Vercel AI SDK** | ❌ | ❌ | ❌ | ✅ |
| **Tool Calling** | ❌ | ❌ | ✅ | ✅ |
| **Structured Output** | ❌ | ❌ | ✅ | ✅ |

---

## Detailed Analysis

### 1. react-native-executorch (Software Mansion)

**Strengths:**
- Backed by Software Mansion (reputable RN company)
- Cross-platform (iOS + Android)
- Wide model support (LLMs, vision, speech)
- Active development with frequent releases
- Good documentation and examples
- Declarative React hooks API

**Weaknesses:**
- Requires model download on both platforms
- Larger binary size due to ExecuTorch runtime
- Models need conversion to ExecuTorch format (.pte)
- More complex setup than platform-native solutions

**Best For:** Cross-platform consistency, Meta ecosystem models

### 2. expo-llm-mediapipe (Community)

**Strengths:**
- Designed specifically for Expo
- Google MediaPipe backend (well-maintained)
- Supports latest Gemma 3n models
- Simple declarative API
- Good model download/management built in

**Weaknesses:**
- Community-maintained (not official Google)
- Smaller community than ExecuTorch
- MediaPipe format required (.tflite / .litertlm)
- Limited model selection compared to ExecuTorch

**Best For:** Android primary, Google model ecosystem

### 3. react-native-apple-llm / @react-native-ai/apple

**Strengths:**
- Uses Apple's built-in model — NO download needed
- Best iOS performance (optimized for Apple Silicon)
- Supports structured output (JSON) and tool calling
- Free — no API costs, no model hosting
- Best privacy (Apple's on-device processing guarantees)
- @react-native-ai/apple has Vercel AI SDK compatibility

**Weaknesses:**
- iOS 26+ only (not yet released publicly)
- Limited to Apple Intelligence devices (iPhone 15 Pro+)
- No Android support
- Still in preview
- No model customization (use Apple's model only)

**Best For:** iOS-first, zero-config experience, privacy

---

## Recommended Strategy

### Hybrid Approach (Recommended)

```
iOS:  Apple Foundation Models (@react-native-ai/apple)
      → Zero download, best performance, native integration
      → Fallback: react-native-executorch for older iOS

Android: expo-llm-mediapipe (MediaPipe LLM)
         → Best Android support with Gemma 3n
         → Fallback: react-native-executorch for broader model support
```

### Rationale

1. **iOS with Apple FM**: On supported devices, Apple Intelligence provides the best experience — no model download, optimized performance, structured outputs, and tool calling. This is the ideal zero-config experience for iPhone users.

2. **Android with MediaPipe**: Google's MediaPipe is the most mature LLM inference solution for Android, with excellent support for Gemma 3n (2B params, designed for mobile). The expo-llm-mediapipe library provides an Expo-compatible wrapper.

3. **ExecuTorch as universal fallback**: For devices that don't support Apple FM (older iOS) or where MediaPipe doesn't work well, ExecuTorch provides a reliable cross-platform alternative with a wide model selection.

### Why Not Single Library?

- ExecuTorch alone misses the zero-download experience on iOS
- Apple FM alone doesn't cover Android
- MediaPipe alone doesn't leverage Apple's superior on-device capabilities

The hybrid approach gives each platform its best experience while the `BaseProvider` abstraction keeps the code clean.

---

## Model Recommendations

### For Android (MediaPipe)

| Model | Parameters | Size | Speed | Quality | Recommendation |
|-------|-----------|------|-------|---------|---------------|
| Gemma 3n E2B | 2B | ~1.5GB | Fast | Good | ✅ Default |
| Gemma 2B | 2B | ~1.5GB | Fast | Good | Alternative |
| Phi-3 Mini | 3.8B | ~2.3GB | Medium | Better | Power users |

### For iOS (Apple Foundation Models)

| Model | Parameters | Size | Speed | Quality | Recommendation |
|-------|-----------|------|-------|---------|---------------|
| Apple Intelligence | ~3B | Built-in | Very Fast | Very Good | ✅ Automatic |

### For Fallback (ExecuTorch)

| Model | Parameters | Size | Speed | Quality | Recommendation |
|-------|-----------|------|-------|---------|---------------|
| SmolLM 2 135M | 135M | ~270MB | Very Fast | Basic | Minimal devices |
| SmolLM 2 360M | 360M | ~720MB | Fast | Fair | Budget devices |
| Llama 3.2 1B | 1B | ~1.2GB | Medium | Good | Mid-range |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS 26 delayed or FM API changes | High | ExecuTorch fallback ready |
| expo-llm-mediapipe abandoned | Medium | Can switch to react-native-llm-mediapipe or ExecuTorch |
| Model quality insufficient for entity extraction | Medium | Test with CoBrain's specific prompts; tune prompts for smaller models |
| Storage pushback from users | Medium | Start with smallest model; clear storage management UI |

---

## Conclusion

The on-device LLM landscape for React Native is mature enough for production use. A hybrid strategy leveraging platform-native solutions (Apple FM + MediaPipe) with ExecuTorch as fallback provides the best balance of performance, user experience, and cross-platform coverage. CoBrain would be among the first open-source note apps to offer this capability on both platforms.
