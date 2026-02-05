/**
 * @cobrain/ocr - Image OCR for CoBrain
 *
 * Extract text from images using Tesseract.js (local processing, privacy-first)
 */

// Main OCR functions
export {
  extractText,
  getSupportedLanguages,
  preloadLanguage,
  terminate,
} from './tesseract.js'

// Image processing utilities
export {
  validateImage,
  loadImage,
  getImageDimensions,
  processImage,
  stripExif,
  toDataURL,
} from './image-processor.js'

// Text cleaning utilities
export {
  cleanText,
  splitParagraphs,
  extractPotentialEntities,
  getTextStats,
  estimateHandwritten,
  formatConfidence,
} from './text-cleaner.js'

// Types
export type {
  OCRResult,
  OCROptions,
  OCRProgress,
  OCRProgressCallback,
  BlockResult,
  LineResult,
  WordResult,
  BoundingBox,
  ImageProcessingOptions,
  SupportedImageFormat,
} from './types.js'

// Constants
export {
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  MAX_DIMENSION,
} from './types.js'
