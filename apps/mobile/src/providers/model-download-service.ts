import * as FileSystem from 'expo-file-system'
import type {
  LocalModel,
  DownloadedModel,
  ModelDownloadProgress,
} from '@cobrain/core/src/types'

const MODELS_DIR = `${FileSystem.documentDirectory}models/`

/**
 * Service for downloading, managing, and deleting on-device LLM model files.
 * Uses expo-file-system for resumable downloads with progress tracking.
 */

let activeDownload: FileSystem.DownloadResumable | null = null

async function ensureModelsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true })
  }
}

function sanitizeModelId(modelId: string): string {
  const sanitized = modelId.replace(/[^a-zA-Z0-9._-]/g, '')
  if (!sanitized || sanitized !== modelId) {
    throw new Error(`Invalid model ID: ${modelId}`)
  }
  return sanitized
}

function getModelPath(modelId: string): string {
  return `${MODELS_DIR}${sanitizeModelId(modelId)}`
}

export async function downloadModel(
  model: LocalModel,
  onProgress: (progress: ModelDownloadProgress) => void
): Promise<DownloadedModel> {
  if (model.sizeBytes === 0) {
    throw new Error('This model is built-in and does not need downloading.')
  }

  await ensureModelsDir()

  const localPath = getModelPath(model.id)

  // Check if already downloaded
  const existing = await FileSystem.getInfoAsync(localPath)
  if (existing.exists && existing.size && existing.size > 0) {
    return {
      ...model,
      localPath,
      downloadedAt: new Date(),
    }
  }

  // Start resumable download
  const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
    const bytesDownloaded = downloadProgress.totalBytesWritten
    const totalBytes = downloadProgress.totalBytesExpectedToWrite

    onProgress({
      modelId: model.id,
      status: 'downloading',
      bytesDownloaded,
      totalBytes: totalBytes > 0 ? totalBytes : model.sizeBytes,
      speedBps: 0,
    })
  }

  activeDownload = FileSystem.createDownloadResumable(
    model.downloadUrl,
    localPath,
    {},
    callback
  )

  onProgress({
    modelId: model.id,
    status: 'downloading',
    bytesDownloaded: 0,
    totalBytes: model.sizeBytes,
    speedBps: 0,
  })

  try {
    const result = await activeDownload.downloadAsync()
    activeDownload = null

    if (!result || result.status !== 200) {
      // Clean up partial file
      await FileSystem.deleteAsync(localPath, { idempotent: true })
      throw new Error(`Download failed with status ${result?.status ?? 'unknown'}`)
    }

    onProgress({
      modelId: model.id,
      status: 'completed',
      bytesDownloaded: model.sizeBytes,
      totalBytes: model.sizeBytes,
      speedBps: 0,
    })

    return {
      ...model,
      localPath,
      downloadedAt: new Date(),
    }
  } catch (error) {
    activeDownload = null

    // Don't clean up on pause — only on real errors
    if (error instanceof Error && error.message.includes('cancelled')) {
      onProgress({
        modelId: model.id,
        status: 'idle',
        bytesDownloaded: 0,
        totalBytes: model.sizeBytes,
        speedBps: 0,
      })
    } else {
      await FileSystem.deleteAsync(localPath, { idempotent: true })
      onProgress({
        modelId: model.id,
        status: 'error',
        bytesDownloaded: 0,
        totalBytes: model.sizeBytes,
        speedBps: 0,
      })
    }

    throw error
  }
}

export async function cancelDownload(): Promise<void> {
  if (activeDownload) {
    try {
      await activeDownload.pauseAsync()
    } catch {
      // Ignore errors on cancel
    }
    activeDownload = null
  }
}

export async function deleteModelFile(modelId: string): Promise<void> {
  const localPath = getModelPath(modelId)
  await FileSystem.deleteAsync(localPath, { idempotent: true })
}

export async function isModelDownloaded(modelId: string): Promise<boolean> {
  const localPath = getModelPath(modelId)
  const info = await FileSystem.getInfoAsync(localPath)
  return info.exists && (info.size ?? 0) > 0
}

export async function getModelFilePath(modelId: string): Promise<string | null> {
  const localPath = getModelPath(modelId)
  const info = await FileSystem.getInfoAsync(localPath)
  if (info.exists && (info.size ?? 0) > 0) {
    return localPath
  }
  return null
}

export async function getStorageUsed(): Promise<number> {
  try {
    await ensureModelsDir()
    const files = await FileSystem.readDirectoryAsync(MODELS_DIR)
    let totalSize = 0
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${MODELS_DIR}${file}`)
      if (info.exists && info.size) {
        totalSize += info.size
      }
    }
    return totalSize
  } catch {
    return 0
  }
}
