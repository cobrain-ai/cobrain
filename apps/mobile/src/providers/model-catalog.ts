import type { LocalModel } from '@cobrain/core/src/types'
import { Platform } from 'react-native'

/**
 * Catalog of available on-device LLM models.
 * Models are filtered by current platform.
 */

const ALL_MODELS: LocalModel[] = [
  // Apple Foundation Models — built into iOS 26+, no download
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
  },
  // Google Gemma 3n for Android via MediaPipe
  {
    id: 'gemma-3n-e2b',
    name: 'Gemma 3n E2B',
    description: 'Google\'s efficient 2B model optimized for mobile.',
    parameters: '2B',
    sizeBytes: 1_500_000_000,
    downloadUrl: 'https://huggingface.co/google/gemma-3n-E2B-it/resolve/main/gemma3n-E2B-it-int4.task',
    platform: 'android',
    quality: 'good',
    speed: 'fast',
  },
  // Cross-platform smaller models
  {
    id: 'smollm2-360m',
    name: 'SmolLM 2 360M',
    description: 'Very small model for basic tasks. Fastest option.',
    parameters: '360M',
    sizeBytes: 720_000_000,
    downloadUrl: 'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/main/smollm2-360m.pte',
    platform: 'both',
    quality: 'basic',
    speed: 'very-fast',
  },
  {
    id: 'smollm2-135m',
    name: 'SmolLM 2 135M',
    description: 'Ultra-light model for minimal devices.',
    parameters: '135M',
    sizeBytes: 270_000_000,
    downloadUrl: 'https://huggingface.co/software-mansion/react-native-executorch-smolLm-2/resolve/main/smollm2-135m.pte',
    platform: 'both',
    quality: 'basic',
    speed: 'very-fast',
  },
]

export function getAvailableModels(): LocalModel[] {
  const platform = Platform.OS
  return ALL_MODELS.filter(
    (m) => m.platform === 'both' || m.platform === platform
  )
}

export function getRecommendedModel(): LocalModel | undefined {
  const platform = Platform.OS
  if (platform === 'ios') {
    return ALL_MODELS.find((m) => m.id === 'apple-foundation')
  }
  return ALL_MODELS.find((m) => m.id === 'gemma-3n-e2b')
}

export function getModelById(id: string): LocalModel | undefined {
  return ALL_MODELS.find((m) => m.id === id)
}

export function formatModelSize(bytes: number): string {
  if (bytes === 0) return 'Built-in'
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  return `${(bytes / 1_000_000_000).toFixed(1)} GB`
}
