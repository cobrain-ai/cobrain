/**
 * Tesseract.js wrapper for OCR functionality
 */

import { createWorker, Worker, RecognizeResult } from 'tesseract.js'
import {
  OCRResult,
  OCROptions,
  OCRProgress,
  BlockResult,
  LineResult,
  WordResult,
  BoundingBox,
} from './types.js'
import { processImage, getImageDimensions, toDataURL } from './image-processor.js'
import { cleanText } from './text-cleaner.js'

// Singleton worker for reuse
let worker: Worker | null = null
let currentLanguage = 'eng'

/**
 * Initialize or get existing Tesseract worker
 */
async function getWorker(
  language: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<Worker> {
  // Reuse existing worker if same language
  if (worker && currentLanguage === language) {
    return worker
  }

  // Terminate old worker if language changed
  if (worker) {
    await worker.terminate()
    worker = null
  }

  onProgress?.({
    status: 'loading',
    progress: 0,
    message: 'Loading OCR engine...',
  })

  worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === 'loading tesseract core') {
        onProgress?.({
          status: 'loading',
          progress: 0.1,
          message: 'Loading OCR core...',
        })
      } else if (m.status === 'initializing tesseract') {
        onProgress?.({
          status: 'initializing',
          progress: 0.2,
          message: 'Initializing OCR...',
        })
      } else if (m.status === 'loading language traineddata') {
        onProgress?.({
          status: 'loading',
          progress: 0.3,
          message: `Loading ${language} language data...`,
        })
      } else if (m.status === 'initializing api') {
        onProgress?.({
          status: 'initializing',
          progress: 0.5,
          message: 'Preparing OCR engine...',
        })
      } else if (m.status === 'recognizing text') {
        onProgress?.({
          status: 'recognizing',
          progress: 0.5 + m.progress * 0.5,
          message: 'Extracting text...',
        })
      }
    },
  })

  currentLanguage = language
  return worker
}

/**
 * Convert Tesseract bounding box to our format
 */
function toBBox(box: { x0: number; y0: number; x1: number; y1: number }): BoundingBox {
  return {
    x0: box.x0,
    y0: box.y0,
    x1: box.x1,
    y1: box.y1,
  }
}

/**
 * Parse Tesseract result into our format
 */
function parseResult(result: RecognizeResult): {
  blocks: BlockResult[]
  confidence: number
} {
  const blocks: BlockResult[] = []
  let totalConfidence = 0
  let wordCount = 0

  for (const block of result.data.blocks || []) {
    const blockLines: LineResult[] = []

    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        const lineWords: WordResult[] = []

        for (const word of line.words || []) {
          lineWords.push({
            text: word.text,
            confidence: word.confidence,
            bbox: toBBox(word.bbox),
          })
          totalConfidence += word.confidence
          wordCount++
        }

        blockLines.push({
          text: line.text,
          confidence: line.confidence,
          bbox: toBBox(line.bbox),
          words: lineWords,
        })
      }
    }

    blocks.push({
      text: block.text,
      confidence: block.confidence,
      bbox: toBBox(block.bbox),
      lines: blockLines,
    })
  }

  const avgConfidence = wordCount > 0 ? totalConfidence / wordCount : 0

  return { blocks, confidence: avgConfidence }
}

/**
 * Extract text from an image using OCR
 */
export async function extractText(
  image: File | Blob | string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const {
    language = 'eng',
    onProgress,
    preprocess = true,
  } = options

  const startTime = performance.now()

  // Get image dimensions
  let imageDimensions = { width: 0, height: 0 }
  try {
    imageDimensions = await getImageDimensions(image)
  } catch {
    // Dimensions not critical, continue
  }

  // Preprocess image if needed
  let processedImage: File | Blob | string = image

  if (preprocess && (image instanceof File || image instanceof Blob)) {
    onProgress?.({
      status: 'initializing',
      progress: 0.05,
      message: 'Preprocessing image...',
    })

    processedImage = await processImage(image, {
      maxDimension: 2048, // Smaller for faster processing
      enhanceContrast: true,
      grayscale: false, // Color can help with some text
    })
  }

  // Get or create worker
  const tesseractWorker = await getWorker(language, onProgress)

  // Convert to data URL if needed (Tesseract works best with data URLs)
  let imageData: string
  if (typeof processedImage === 'string') {
    imageData = processedImage
  } else {
    imageData = await toDataURL(processedImage)
  }

  // Perform OCR
  const result = await tesseractWorker.recognize(imageData)

  // Parse result
  const { blocks, confidence } = parseResult(result)

  // Clean up text
  const rawText = result.data.text
  const cleanedText = cleanText(rawText)

  const processingTime = performance.now() - startTime

  onProgress?.({
    status: 'complete',
    progress: 1,
    message: 'Text extraction complete',
  })

  return {
    text: cleanedText,
    confidence,
    blocks,
    processingTime,
    language,
    imageDimensions,
  }
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
    { code: 'rus', name: 'Russian' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'chi_tra', name: 'Chinese (Traditional)' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
  ]
}

/**
 * Preload a language for faster first use
 */
export async function preloadLanguage(
  language: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<void> {
  await getWorker(language, onProgress)
}

/**
 * Terminate the worker to free resources
 */
export async function terminate(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
    currentLanguage = 'eng'
  }
}
