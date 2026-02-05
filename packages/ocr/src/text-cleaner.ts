/**
 * Post-processing utilities for OCR text cleanup
 */

/**
 * Clean up common OCR artifacts
 */
export function cleanText(text: string): string {
  let cleaned = text

  // Remove excessive whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ')

  // Normalize line breaks
  cleaned = cleaned.replace(/\r\n/g, '\n')
  cleaned = cleaned.replace(/\r/g, '\n')

  // Remove excessive line breaks (more than 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // Trim each line
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  // Remove common OCR artifacts
  cleaned = cleaned.replace(/[|¦]/g, 'I') // Pipe to I
  cleaned = cleaned.replace(/[`´]/g, "'") // Various quotes
  cleaned = cleaned.replace(/[""]/g, '"') // Smart quotes
  cleaned = cleaned.replace(/['']/g, "'") // Smart apostrophes
  cleaned = cleaned.replace(/…/g, '...') // Ellipsis
  cleaned = cleaned.replace(/—/g, '-') // Em dash
  cleaned = cleaned.replace(/–/g, '-') // En dash

  // Fix common OCR mistakes
  cleaned = cleaned.replace(/\bl\b/g, 'I') // Standalone l to I
  cleaned = cleaned.replace(/\bO\b(?=[a-z])/g, '0') // O before lowercase
  cleaned = cleaned.replace(/\b0\b(?=[A-Z])/g, 'O') // 0 before uppercase

  // Trim overall
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Split text into paragraphs based on blank lines
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Extract potential entities from OCR text
 */
export function extractPotentialEntities(text: string): {
  emails: string[]
  urls: string[]
  dates: string[]
  numbers: string[]
} {
  const emails: string[] = []
  const urls: string[] = []
  const dates: string[] = []
  const numbers: string[] = []

  // Email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  let match
  while ((match = emailRegex.exec(text)) !== null) {
    emails.push(match[0])
  }

  // URL pattern
  const urlRegex = /https?:\/\/[^\s<>)"']+/gi
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[0])
  }

  // Date patterns (various formats)
  const datePatterns = [
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g, // MM/DD/YYYY
    /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/g, // YYYY-MM-DD
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/gi,
    /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}/gi,
  ]

  for (const pattern of datePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      dates.push(match[0])
    }
  }

  // Phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g
  while ((match = phoneRegex.exec(text)) !== null) {
    numbers.push(match[0])
  }

  return {
    emails: [...new Set(emails)],
    urls: [...new Set(urls)],
    dates: [...new Set(dates)],
    numbers: [...new Set(numbers)],
  }
}

/**
 * Calculate text statistics
 */
export function getTextStats(text: string): {
  characterCount: number
  wordCount: number
  lineCount: number
  paragraphCount: number
} {
  const characters = text.length
  const words = text.split(/\s+/).filter((w) => w.length > 0).length
  const lines = text.split('\n').length
  const paragraphs = splitParagraphs(text).length

  return {
    characterCount: characters,
    wordCount: words,
    lineCount: lines,
    paragraphCount: paragraphs,
  }
}

/**
 * Estimate if text is primarily handwritten based on confidence
 */
export function estimateHandwritten(confidence: number): boolean {
  // Handwritten text typically has lower OCR confidence
  return confidence < 70
}

/**
 * Format confidence as readable percentage
 */
export function formatConfidence(confidence: number): string {
  if (confidence >= 90) return 'High'
  if (confidence >= 70) return 'Medium'
  if (confidence >= 50) return 'Low'
  return 'Very Low'
}
