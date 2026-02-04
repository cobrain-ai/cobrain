'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Loader2, FileImage, Check } from 'lucide-react'
import { useImageOCR } from '@/hooks/use-image-ocr'

interface ImageOCRProps {
  onTextExtracted: (text: string) => void
}

export function ImageOCR({ onTextExtracted }: ImageOCRProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { progress, result, isProcessing, extractFromFile, reset, terminate } = useImageOCR()

  // Cleanup on unmount: revoke Object URL and terminate worker
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
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
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
    [extractFromFile, onTextExtracted]
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
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl, reset])

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
            accept="image/*"
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
            Supports PNG, JPG, GIF, WebP. Text will be extracted using OCR.
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
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">{progress.message}</p>
              <div className="w-48 h-2 bg-white/30 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success overlay */}
          {progress.status === 'complete' && result && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs">
              <Check className="h-3 w-3" />
              <span>
                {result.confidence.toFixed(0)}% confidence
              </span>
            </div>
          )}

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Extracted text preview */}
      {progress.status === 'complete' && result && result.text && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Extracted Text
            </span>
            <span className="text-xs text-gray-500">
              {result.processingTimeMs}ms
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {result.text}
          </p>
        </div>
      )}

      {/* Error state */}
      {progress.status === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {progress.message}
        </div>
      )}
    </div>
  )
}
