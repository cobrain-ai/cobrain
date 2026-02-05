// Image OCR Hook
// Provides OCR functionality using @cobrain/ocr for extracting text from images

'use client'

import { useState, useCallback, useRef } from 'react'

export interface OCRResult {
  text: string
  confidence: number
  processingTimeMs: number
  language: string
  wordCount: number
  imageDimensions?: {
    width: number
    height: number
  }
}

export interface OCRProgress {
  status: 'idle' | 'loading' | 'preprocessing' | 'recognizing' | 'complete' | 'error'
  progress: number // 0-100
  message: string
}

export interface UseImageOCROptions {
  language?: string
  preprocess?: boolean
}

/**
 * Hook for image OCR functionality
 * Uses dynamic import to load Tesseract.js only when needed
 */
export function useImageOCR(options: UseImageOCROptions = {}) {
  const { language = 'eng', preprocess = true } = options

  const [progress, setProgress] = useState<OCRProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  })
  const [result, setResult] = useState<OCRResult | null>(null)
  const workerRef = useRef<any>(null)

  /**
   * Initialize Tesseract worker
   */
  const initWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current

    setProgress({ status: 'loading', progress: 0, message: 'Loading OCR engine...' })

    try {
      // Dynamic import Tesseract.js
      const Tesseract = await import('tesseract.js')

      const worker = await Tesseract.createWorker(language, 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'loading tesseract core') {
            setProgress({
              status: 'loading',
              progress: 10,
              message: 'Loading OCR core...',
            })
          } else if (m.status === 'initializing tesseract') {
            setProgress({
              status: 'loading',
              progress: 20,
              message: 'Initializing OCR...',
            })
          } else if (m.status === 'loading language traineddata') {
            setProgress({
              status: 'loading',
              progress: 30,
              message: 'Loading language data...',
            })
          } else if (m.status === 'initializing api') {
            setProgress({
              status: 'loading',
              progress: 50,
              message: 'Preparing OCR engine...',
            })
          } else if (m.status === 'recognizing text') {
            setProgress({
              status: 'recognizing',
              progress: 50 + Math.round(m.progress * 50),
              message: `Extracting text... ${Math.round(m.progress * 100)}%`,
            })
          }
        },
      })

      workerRef.current = worker
      return worker
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error)
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Failed to load OCR engine',
      })
      throw error
    }
  }, [language])

  /**
   * Preprocess image for better OCR results
   */
  const preprocessImage = useCallback(
    async (file: File | Blob): Promise<Blob> => {
      if (!preprocess) return file

      setProgress((prev) => ({
        ...prev,
        status: 'preprocessing',
        message: 'Preprocessing image...',
      }))

      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          // Calculate dimensions (max 2048px)
          const maxDim = 2048
          let width = img.width
          let height = img.height

          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height)

          // Apply contrast enhancement
          const imageData = ctx.getImageData(0, 0, width, height)
          const data = imageData.data
          const factor = 1.15 // Slight contrast boost

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
            data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
            data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))
          }

          ctx.putImageData(imageData, 0, 0)
          URL.revokeObjectURL(img.src)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to create blob'))
              }
            },
            'image/png',
            0.95
          )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      })
    },
    [preprocess]
  )

  /**
   * Clean extracted text
   */
  const cleanText = useCallback((text: string): string => {
    let cleaned = text

    // Normalize whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ')
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

    // Trim lines
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trim())
      .join('\n')

    // Fix common OCR mistakes
    cleaned = cleaned.replace(/[|¦]/g, 'I')
    cleaned = cleaned.replace(/[`´]/g, "'")
    cleaned = cleaned.replace(/[""]/g, '"')
    cleaned = cleaned.replace(/['']/g, "'")

    return cleaned.trim()
  }, [])

  /**
   * Extract text from an image
   */
  const extractText = useCallback(
    async (image: File | Blob | string): Promise<OCRResult | null> => {
      const startTime = Date.now()

      try {
        // Preprocess if it's a file/blob
        let processedImage: File | Blob | string = image
        if (image instanceof File || image instanceof Blob) {
          processedImage = await preprocessImage(image)
        }

        const worker = await initWorker()

        setProgress({
          status: 'recognizing',
          progress: 50,
          message: 'Starting text recognition...',
        })

        const { data } = await worker.recognize(processedImage)

        const rawText = data.text.trim()
        const cleanedText = cleanText(rawText)
        const wordCount = cleanedText.split(/\s+/).filter((w) => w.length > 0).length

        const ocrResult: OCRResult = {
          text: cleanedText,
          confidence: data.confidence,
          processingTimeMs: Date.now() - startTime,
          language,
          wordCount,
        }

        setResult(ocrResult)
        setProgress({
          status: 'complete',
          progress: 100,
          message: `Extracted ${wordCount} words (${ocrResult.confidence.toFixed(0)}% confidence)`,
        })

        return ocrResult
      } catch (error) {
        console.error('OCR extraction failed:', error)
        setProgress({
          status: 'error',
          progress: 0,
          message: 'Failed to extract text from image',
        })
        return null
      }
    },
    [initWorker, preprocessImage, cleanText, language]
  )

  /**
   * Validate image file
   */
  const validateImage = useCallback((file: File): { valid: boolean; error?: string } => {
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!supportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported format. Supported: PNG, JPEG, WEBP, GIF`,
      }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large (max 10MB)`,
      }
    }

    return { valid: true }
  }, [])

  /**
   * Extract text from a pasted image
   */
  const extractFromPaste = useCallback(
    async (event: ClipboardEvent): Promise<OCRResult | null> => {
      const items = event.clipboardData?.items
      if (!items) return null

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) {
            return extractText(blob)
          }
        }
      }

      return null
    },
    [extractText]
  )

  /**
   * Extract text from a dropped image
   */
  const extractFromDrop = useCallback(
    async (event: DragEvent): Promise<OCRResult | null> => {
      const files = event.dataTransfer?.files
      if (!files || files.length === 0) return null

      const file = files[0]
      if (file.type.startsWith('image/')) {
        return extractText(file)
      }

      return null
    },
    [extractText]
  )

  /**
   * Extract text from file input
   */
  const extractFromFile = useCallback(
    async (file: File): Promise<OCRResult | null> => {
      const validation = validateImage(file)
      if (!validation.valid) {
        setProgress({
          status: 'error',
          progress: 0,
          message: validation.error || 'Invalid file',
        })
        return null
      }

      return extractText(file)
    },
    [extractText, validateImage]
  )

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setProgress({ status: 'idle', progress: 0, message: '' })
    setResult(null)
  }, [])

  /**
   * Cleanup worker
   */
  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate()
      workerRef.current = null
    }
    reset()
  }, [reset])

  return {
    // State
    progress,
    result,
    isProcessing:
      progress.status === 'loading' ||
      progress.status === 'preprocessing' ||
      progress.status === 'recognizing',

    // Actions
    extractText,
    extractFromPaste,
    extractFromDrop,
    extractFromFile,
    validateImage,
    reset,
    terminate,
  }
}

export type UseImageOCRReturn = ReturnType<typeof useImageOCR>
