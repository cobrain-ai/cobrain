'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Loader2, FileImage, Check, AlertCircle, Copy, RotateCcw } from 'lucide-react'
import { useImageOCR } from '@/hooks/use-image-ocr'

interface ImageOCRProps {
  onTextExtracted: (text: string) => void
  language?: string
}

export function ImageOCR({ onTextExtracted, language = 'eng' }: ImageOCRProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    progress,
    result,
    isProcessing,
    extractFromFile,
    validateImage,
    reset,
    terminate,
  } = useImageOCR({ language })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      terminate()
    }
  }, [previewUrl, terminate])

  const handleFile = useCallback(
    async (file: File) => {
      // Validate first
      const validation = validateImage(file)
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      // Create preview
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Extract text
      const ocrResult = await extractFromFile(file)
      if (ocrResult && ocrResult.text) {
        onTextExtracted(ocrResult.text)
      }
    },
    [extractFromFile, validateImage, onTextExtracted]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        await handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        await handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleClear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setCopied(false)
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl, reset])

  const handleCopyText = useCallback(async () => {
    if (result?.text) {
      try {
        await navigator.clipboard.writeText(result.text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }, [result])

  const handleRetry = useCallback(async () => {
    if (fileInputRef.current?.files?.[0]) {
      reset()
      await handleFile(fileInputRef.current.files[0])
    }
  }, [reset, handleFile])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-500 bg-green-500/10'
    if (confidence >= 70) return 'text-yellow-500 bg-yellow-500/10'
    return 'text-red-500 bg-red-500/10'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'High accuracy'
    if (confidence >= 70) return 'Medium accuracy'
    return 'Low accuracy'
  }

  return (
    <div className="space-y-4">
      {/* Drop zone or preview */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drop an image here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">
            Supports PNG, JPG, GIF, WebP (max 10MB). Text will be extracted locally using OCR.
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Image preview */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-h-64 object-contain bg-gray-100 dark:bg-gray-800"
          />

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm font-medium">{progress.message}</p>
              <div className="w-48 h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="text-xs text-white/70 mt-2">{progress.progress}%</p>
            </div>
          )}

          {/* Success badge */}
          {progress.status === 'complete' && result && (
            <div
              className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidence)}`}
            >
              <Check className="h-3 w-3" />
              <span>{result.confidence.toFixed(0)}%</span>
              <span className="hidden sm:inline">- {getConfidenceLabel(result.confidence)}</span>
            </div>
          )}

          {/* Control buttons */}
          <div className="absolute top-2 left-2 flex gap-2">
            <button
              onClick={handleClear}
              className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="Clear"
            >
              <X className="h-4 w-4" />
            </button>
            {progress.status === 'complete' && (
              <button
                onClick={handleRetry}
                className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                title="Retry OCR"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Extracted text preview */}
      {progress.status === 'complete' && result && result.text && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Extracted Text
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {result.wordCount} words - {result.processingTimeMs}ms
              </span>
              <button
                onClick={handleCopyText}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy text"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {result.text}
          </p>

          {/* Low confidence warning */}
          {result.confidence < 70 && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">
                Low confidence text extraction. The image may contain handwriting or unclear text.
                Consider reviewing and editing the extracted text.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {progress.status === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {progress.message}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              Try uploading a different image or check the file format.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export type { ImageOCRProps }
