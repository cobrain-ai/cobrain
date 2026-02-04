'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type ImportFormat = 'markdown' | 'obsidian' | 'notion'

interface ImportResult {
  total: number
  imported: number
  failed: number
  notes: { id: string; title: string }[]
  errors: { file: string; error: string }[]
}

export default function ImportPage() {
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('markdown')
  const [files, setFiles] = useState<File[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles))
      setResult(null)
      setError(null)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles) {
      setFiles(Array.from(droppedFiles))
      setResult(null)
      setError(null)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const startImport = async () => {
    if (files.length === 0) return

    setIsImporting(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('format', selectedFormat)
      files.forEach((file) => {
        formData.append('files', file)
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90))
      }, 200)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const clearFiles = () => {
    setFiles([])
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formats = [
    {
      id: 'markdown' as const,
      name: 'Markdown',
      description: 'Standard .md files',
      icon: '📝',
      accept: '.md,.markdown,.txt',
    },
    {
      id: 'obsidian' as const,
      name: 'Obsidian',
      description: 'Obsidian vault exports with wikilinks',
      icon: '💎',
      accept: '.md,.markdown',
    },
    {
      id: 'notion' as const,
      name: 'Notion',
      description: 'Notion HTML or Markdown exports',
      icon: '📓',
      accept: '.md,.html,.htm',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Import Notes
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Import your notes from other apps into CoBrain
        </p>
      </div>

      {/* Format Selection */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Format
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {formats.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedFormat === format.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="text-2xl">{format.icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-2">
                {format.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Upload Files
        </h2>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={formats.find((f) => f.id === selectedFormat)?.accept}
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or{' '}
            <label
              htmlFor="file-input"
              className="text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              browse
            </label>
          </p>
          <p className="text-sm text-gray-400">
            Supports: {formats.find((f) => f.id === selectedFormat)?.accept}
          </p>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearFiles}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Clear all
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                >
                  <FileIcon className="w-4 h-4 text-gray-400" />
                  <span className="truncate flex-1 text-gray-700 dark:text-gray-300">
                    {file.name}
                  </span>
                  <span className="text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {isImporting && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Importing...
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400">
              Import Complete
            </span>
          </div>
          <div className="text-sm text-green-600 dark:text-green-500">
            <p>
              {result.imported} of {result.total} files imported successfully
            </p>
            {result.failed > 0 && (
              <p className="text-orange-600 dark:text-orange-400">
                {result.failed} files failed
              </p>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              <p className="font-medium">Errors:</p>
              {result.errors.map((err, i) => (
                <p key={i}>
                  {err.file}: {err.error}
                </p>
              ))}
            </div>
          )}
          <Link
            href="/notes"
            className="inline-block mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
          >
            View Imported Notes
          </Link>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={startImport}
        disabled={files.length === 0 || isImporting}
        className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
      >
        {isImporting ? 'Importing...' : `Import ${files.length} File${files.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
