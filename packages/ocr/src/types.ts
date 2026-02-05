/**
 * OCR Types for CoBrain
 */

export interface BoundingBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface WordResult {
  text: string
  confidence: number
  bbox: BoundingBox
}

export interface LineResult {
  text: string
  confidence: number
  bbox: BoundingBox
  words: WordResult[]
}

export interface BlockResult {
  text: string
  confidence: number
  bbox: BoundingBox
  lines: LineResult[]
}

export interface OCRResult {
  /** Extracted text content */
  text: string
  /** Overall confidence score (0-100) */
  confidence: number
  /** Text blocks with position info */
  blocks: BlockResult[]
  /** Processing time in milliseconds */
  processingTime: number
  /** Language used for recognition */
  language: string
  /** Image dimensions */
  imageDimensions: {
    width: number
    height: number
  }
}

export interface OCRProgress {
  status: 'loading' | 'initializing' | 'recognizing' | 'complete'
  progress: number // 0-1
  message: string
}

export type OCRProgressCallback = (progress: OCRProgress) => void

export interface OCROptions {
  /** Language code (default: 'eng') */
  language?: string
  /** Progress callback */
  onProgress?: OCRProgressCallback
  /** Enable preprocessing (contrast, resize) */
  preprocess?: boolean
  /** Worker path for custom deployment */
  workerPath?: string
  /** Language data path */
  langPath?: string
}

export interface ImageProcessingOptions {
  /** Maximum dimension (width or height) */
  maxDimension?: number
  /** JPEG quality (0-1) for compression */
  quality?: number
  /** Apply contrast enhancement */
  enhanceContrast?: boolean
  /** Convert to grayscale */
  grayscale?: boolean
}

export type SupportedImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'

export const SUPPORTED_FORMATS: SupportedImageFormat[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_DIMENSION = 4096
