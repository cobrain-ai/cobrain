// Image OCR Hook
// Provides OCR functionality using Tesseract.js for extracting text from images

'use client'

import { useState, useCallback, useRef } from 'react'

export interface OCRResult {
  text: string
  confidence: number
  processingTimeMs: number
}

export interface OCRProgress {
  status: 'idle' | 'loading' | 'recognizing' | 'complete' | 'error'
  progress: number // 0-100
  message: string
}

/**
 * Hook for image OCR functionality
 * Uses dynamic import to load Tesseract.js only when needed
 */
export function useImageOCR() {
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

      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress({
              status: 'recognizing',
              progress: Math.round(m.progress * 100),
              message: `Recognizing text... ${Math.round(m.progress * 100)}%`,
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
  }, [])

  /**
   * Extract text from an image
   */
  const extractText = useCallback(
    async (image: File | Blob | string): Promise<OCRResult | null> => {
      const startTime = Date.now()

      try {
        const worker = await initWorker()

        setProgress({
          status: 'recognizing',
          progress: 0,
          message: 'Starting text recognition...',
        })

        const { data } = await worker.recognize(image)

        const ocrResult: OCRResult = {
          text: data.text.trim(),
          confidence: data.confidence,
          processingTimeMs: Date.now() - startTime,
        }

        setResult(ocrResult)
        setProgress({
          status: 'complete',
          progress: 100,
          message: `Extracted ${data.text.length} characters`,
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
    [initWorker]
  )

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
      if (!file.type.startsWith('image/')) {
        setProgress({
          status: 'error',
          progress: 0,
          message: 'File is not an image',
        })
        return null
      }

      return extractText(file)
    },
    [extractText]
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
    isProcessing: progress.status === 'loading' || progress.status === 'recognizing',

    // Actions
    extractText,
    extractFromPaste,
    extractFromDrop,
    extractFromFile,
    reset,
    terminate,
  }
}

export type UseImageOCRReturn = ReturnType<typeof useImageOCR>
