import { Platform } from 'react-native'
import type {
  LocalLLMBridge,
  LocalModel,
  DownloadedModel,
  ModelDownloadProgress,
} from '@cobrain/core'
import {
  downloadModel as downloadModelFile,
  cancelDownload as cancelModelDownload,
  deleteModelFile,
} from './model-download-service'

/**
 * Platform-dispatching bridge for local LLM inference.
 *
 * On iOS: Uses Apple Foundation Models (via react-native-apple-llm or @react-native-ai/apple)
 * On Android: Uses MediaPipe LLM Inference API (via expo-llm-mediapipe)
 *
 * This file provides the bridge interface and a stub implementation.
 * When native modules are installed, replace the stub with real bindings.
 */

// ─── Apple Foundation Models Bridge (iOS) ───────────────────────────

class AppleFoundationBridge implements LocalLLMBridge {
  async isAvailable(): Promise<boolean> {
    // Apple Foundation Models is available on iPhone 15 Pro+, M1+ iPad
    // with iOS 26+. When the native module is installed, this calls
    // into the native layer to check availability.
    try {
      // TODO: Replace with actual native module call:
      // const { AppleLLM } = require('react-native-apple-llm')
      // return await AppleLLM.isAvailable()
      return false
    } catch {
      return false
    }
  }

  async listDownloadedModels(): Promise<DownloadedModel[]> {
    const available = await this.isAvailable()
    if (!available) return []
    return [
      {
        id: 'apple-foundation',
        name: 'Apple Intelligence',
        description: 'Built-in on-device model. No download needed.',
        parameters: '~3B',
        sizeBytes: 0,
        downloadUrl: '',
        platform: 'ios',
        quality: 'better',
        speed: 'very-fast',
        localPath: 'system',
        downloadedAt: new Date(),
      },
    ]
  }

  async downloadModel(
    _model: LocalModel,
    _onProgress: (progress: ModelDownloadProgress) => void
  ): Promise<DownloadedModel> {
    // Apple Foundation Models don't need downloading
    throw new Error('Apple Intelligence is built-in and does not need downloading')
  }

  async deleteModel(_modelId: string): Promise<void> {
    throw new Error('Cannot delete built-in Apple Intelligence model')
  }

  async cancelDownload(_modelId: string): Promise<void> {
    // No-op for Apple
  }

  async generate(
    _modelId: string,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): Promise<string> {
    // TODO: Replace with actual native module call:
    // const { AppleLLM } = require('react-native-apple-llm')
    // const session = await AppleLLM.createSession({ temperature: options?.temperature })
    // return await session.generate(prompt)
    throw new Error(
      'Apple Foundation Models native module not installed. ' +
      'Install react-native-apple-llm or @react-native-ai/apple.'
    )
  }

  async *generateStream(
    _modelId: string,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): AsyncIterable<string> {
    // TODO: Replace with actual native module streaming:
    // const { AppleLLM } = require('react-native-apple-llm')
    // const session = await AppleLLM.createSession({ temperature: options?.temperature })
    // for await (const token of session.stream(prompt)) { yield token }
    throw new Error(
      'Apple Foundation Models native module not installed. ' +
      'Install react-native-apple-llm or @react-native-ai/apple.'
    )
  }
}

// ─── MediaPipe LLM Bridge (Android) ────────────────────────────────

class MediaPipeLLMBridge implements LocalLLMBridge {
  async isAvailable(): Promise<boolean> {
    // MediaPipe bridge is available on Android when model files are downloaded.
    // Actual inference requires the native module, but download/management works now.
    return Platform.OS === 'android'
  }

  async listDownloadedModels(): Promise<DownloadedModel[]> {
    // The Zustand store (local-llm-store) is the source of truth for downloaded models.
    // This method is kept for bridge interface compatibility.
    return []
  }

  async downloadModel(
    model: LocalModel,
    onProgress: (progress: ModelDownloadProgress) => void
  ): Promise<DownloadedModel> {
    return await downloadModelFile(model, onProgress)
  }

  async deleteModel(modelId: string): Promise<void> {
    await deleteModelFile(modelId)
  }

  async cancelDownload(_modelId: string): Promise<void> {
    await cancelModelDownload()
  }

  async generate(
    modelId: string,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): Promise<string> {
    // TODO: Replace with actual native module call:
    // const { MediaPipeLLM } = require('expo-llm-mediapipe')
    // return await MediaPipeLLM.generate(modelId, prompt, options)
    throw new Error(
      'MediaPipe LLM native module not installed. ' +
      'Install expo-llm-mediapipe for Android support.'
    )
  }

  async *generateStream(
    modelId: string,
    prompt: string,
    options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): AsyncIterable<string> {
    // TODO: Replace with actual native module streaming:
    // const { MediaPipeLLM } = require('expo-llm-mediapipe')
    // for await (const token of MediaPipeLLM.stream(modelId, prompt, options)) { yield token }
    throw new Error(
      'MediaPipe LLM native module not installed. ' +
      'Install expo-llm-mediapipe for Android support.'
    )
  }
}

// ─── Bridge Factory ─────────────────────────────────────────────────

let bridgeInstance: LocalLLMBridge | null = null

export function getLocalLLMBridge(): LocalLLMBridge {
  if (!bridgeInstance) {
    bridgeInstance =
      Platform.OS === 'ios'
        ? new AppleFoundationBridge()
        : new MediaPipeLLMBridge()
  }
  return bridgeInstance
}

export function setLocalLLMBridge(bridge: LocalLLMBridge): void {
  bridgeInstance = bridge
}
