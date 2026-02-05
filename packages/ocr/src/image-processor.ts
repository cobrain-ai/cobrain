/**
 * Image preprocessing utilities for OCR
 */

import {
  ImageProcessingOptions,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  MAX_DIMENSION,
  SupportedImageFormat,
} from './types.js'

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type as SupportedImageFormat)) {
    return {
      valid: false,
      error: `Unsupported format: ${file.type}. Supported: PNG, JPEG, WEBP, GIF`,
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`,
    }
  }

  return { valid: true }
}

/**
 * Load image and return dimensions
 */
export async function loadImage(
  source: File | Blob | string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))

    if (typeof source === 'string') {
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

/**
 * Get image dimensions without fully loading
 */
export async function getImageDimensions(
  source: File | Blob | string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(source)

  // Clean up object URL if created
  if (typeof source !== 'string') {
    URL.revokeObjectURL(img.src)
  }

  return { width: img.width, height: img.height }
}

/**
 * Process image for optimal OCR (resize, enhance)
 */
export async function processImage(
  source: File | Blob,
  options: ImageProcessingOptions = {}
): Promise<Blob> {
  const {
    maxDimension = MAX_DIMENSION,
    quality = 0.9,
    enhanceContrast = false,
    grayscale = false,
  } = options

  const img = await loadImage(source)

  // Calculate new dimensions
  let width = img.width
  let height = img.height

  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height)
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }

  // Create canvas for processing
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Draw image
  ctx.drawImage(img, 0, 0, width, height)

  // Apply enhancements if requested
  if (grayscale || enhanceContrast) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Convert to grayscale
      if (grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = g = b = gray
      }

      // Enhance contrast
      if (enhanceContrast) {
        const factor = 1.2 // Contrast factor
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128))
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128))
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128))
      }

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // Clean up
  URL.revokeObjectURL(img.src)

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create image blob'))
        }
      },
      'image/png',
      quality
    )
  })
}

/**
 * Strip EXIF data from image for privacy
 */
export async function stripExif(file: File): Promise<Blob> {
  // For PNG, WEBP - no EXIF data
  if (file.type !== 'image/jpeg') {
    return file
  }

  // For JPEG, re-encode through canvas to strip EXIF
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(img.src)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to strip EXIF'))
        }
      },
      'image/jpeg',
      0.95
    )
  })
}

/**
 * Convert File/Blob to base64 data URL
 */
export function toDataURL(source: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(source)
  })
}
