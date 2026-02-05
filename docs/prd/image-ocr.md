# PRD: Image OCR for Text Extraction

**Author**: Product Design Agent
**Date**: 2026-02-05
**Status**: Draft
**Issue**: #51

---

## Executive Summary

Add OCR (Optical Character Recognition) capability to CoBrain to extract text from images, enabling users to capture content from photos of whiteboard notes, screenshots, documents, and handwritten notes. This feature bridges the gap between physical and digital note-taking, making all captured content searchable and integrated with the knowledge graph.

---

## Problem Statement

Users frequently encounter text in non-digital formats that they want to capture:
- Whiteboard notes from meetings
- Screenshots of important information
- Photos of handwritten notes
- Document scans and PDFs
- Infographics with embedded text

Currently, users must manually transcribe this content, which is:
- Time-consuming
- Error-prone
- Creates friction in the note-taking workflow

---

## Goals & Objectives

### Primary Goals
1. Enable text extraction from uploaded images
2. Integrate extracted text into the note system
3. Make visual content searchable

### Secondary Goals
1. Support multiple image formats
2. Provide confidence scoring for extracted text
3. Enable entity extraction from OCR'd text

### Success Metrics (KPIs)
- OCR accuracy > 90% for printed text
- OCR accuracy > 70% for clear handwriting
- Processing time < 5 seconds for typical images
- User adoption: 30% of users upload images within first month

---

## User Stories

### US-1: Capture Whiteboard Notes
**As a** meeting participant
**I want to** take a photo of the whiteboard and have the text extracted
**So that** I don't have to manually transcribe meeting notes

**Acceptance Criteria**:
- [ ] User can upload image from device
- [ ] System extracts visible text from whiteboard
- [ ] Extracted text is added to note content
- [ ] Note is searchable by extracted text

### US-2: Screenshot Text Extraction
**As a** researcher
**I want to** upload a screenshot and have text extracted
**So that** I can easily capture information from web pages and apps

**Acceptance Criteria**:
- [ ] Supports PNG, JPG, WEBP formats
- [ ] Text is extracted with proper line breaks
- [ ] System handles different font sizes and styles
- [ ] Special characters are properly recognized

### US-3: Handwritten Notes
**As a** student
**I want to** photograph my handwritten notes
**So that** they become searchable in my digital notebook

**Acceptance Criteria**:
- [ ] System attempts to recognize handwriting
- [ ] Confidence score indicates reliability
- [ ] Low-confidence text is flagged for review
- [ ] Original image is preserved alongside text

### US-4: Document Processing
**As a** professional
**I want to** upload PDF documents and extract text
**So that** I can quickly capture content from reports and contracts

**Acceptance Criteria**:
- [ ] PDF files are supported
- [ ] Multi-page documents are processed
- [ ] Layout is reasonably preserved
- [ ] Tables are converted to text format

---

## Feature Specifications

### Core Features (MVP)

#### 1. Image Upload & Processing
- **Description**: Accept image files and process them through OCR
- **Priority**: High
- **Complexity**: Medium

**Supported Formats**:
- PNG (primary)
- JPEG/JPG
- WEBP
- GIF (first frame only)

**File Limits**:
- Maximum size: 10MB
- Maximum resolution: 4096x4096 pixels

#### 2. Text Extraction
- **Description**: Extract text content from images using Tesseract.js
- **Priority**: High
- **Complexity**: Medium

**Features**:
- Multi-language support (English default, extensible)
- Confidence scoring per word/block
- Preserve basic text structure (paragraphs, lines)

#### 3. Note Integration
- **Description**: Integrate extracted text with note system
- **Priority**: High
- **Complexity**: Low

**Behavior**:
- Create new note with extracted text as content
- Store original image as attachment
- Run entity extraction on OCR text
- Index for search

### Enhanced Features (Phase 2)

#### 4. PDF Processing
- **Description**: Extract text from PDF documents
- **Priority**: Medium
- **Complexity**: Medium

**Approach**:
- Use pdf.js for rendering PDF to images
- Process each page through OCR
- Combine into single note or multiple notes

#### 5. Real-time Camera Capture (Mobile)
- **Description**: Capture images directly from camera
- **Priority**: Medium
- **Complexity**: High

**Features**:
- Camera access via Expo
- Auto-detect document edges
- Guide overlay for positioning

#### 6. Batch Processing
- **Description**: Process multiple images at once
- **Priority**: Low
- **Complexity**: Medium

---

## Technical Requirements

### Functional Requirements
- **REQ-1**: System shall accept PNG, JPG, and WEBP image uploads
- **REQ-2**: System shall extract text using Tesseract.js (local processing)
- **REQ-3**: System shall return confidence scores for extracted text
- **REQ-4**: System shall integrate extracted text with note creation
- **REQ-5**: System shall support English language OCR (default)
- **REQ-6**: System shall store original image alongside extracted text
- **REQ-7**: System shall trigger entity extraction on OCR results

### Non-Functional Requirements
- **Performance**: Process typical image (< 2MB) in under 5 seconds
- **Accuracy**: Achieve > 90% character accuracy on printed text
- **Privacy**: Process locally without sending images to external servers
- **Scalability**: Support concurrent processing on client side
- **Offline**: Core OCR works without internet connection

### Security Requirements
- Images processed client-side (privacy)
- No external API calls for OCR (data stays local)
- Images stored with user data protection
- EXIF data stripped before storage (privacy)

---

## Architecture

### Package Structure
```
packages/ocr/
├── src/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Type definitions
│   ├── tesseract.ts       # Tesseract.js wrapper
│   ├── image-processor.ts # Image preprocessing
│   └── text-cleaner.ts    # Post-processing cleanup
├── package.json
└── tsconfig.json
```

### Component Flow
```
[Image Upload] → [Preprocessing] → [OCR Engine] → [Text Cleanup] → [Note Creation]
                      ↓                                               ↓
              [Image Resize]                                   [Entity Extraction]
              [Contrast Adjust]                                [Search Indexing]
```

### API Design

```typescript
// OCR Service Interface
interface OCRService {
  extractText(image: File | Blob): Promise<OCRResult>
  getSupportedLanguages(): string[]
  loadLanguage(lang: string): Promise<void>
}

interface OCRResult {
  text: string
  confidence: number
  blocks: TextBlock[]
  processingTime: number
  language: string
}

interface TextBlock {
  text: string
  confidence: number
  bbox: BoundingBox
  words: WordResult[]
}
```

---

## Dependencies

### NPM Packages
- `tesseract.js` (^5.x) - Client-side OCR engine
- `sharp` (server-side) - Image preprocessing (if needed)
- `browser-image-compression` - Client-side image optimization

### Language Data
- Tesseract trained data (~15MB for English)
- Loaded on-demand from CDN or bundled

### Integration Points
- Note creation API (`/api/notes`)
- Entity extraction service (`@cobrain/ai`)
- File upload handling (existing)

---

## UI Components

### Image Upload Component
- Drag-and-drop zone
- File picker button
- Preview thumbnail
- Upload progress indicator

### OCR Processing View
- Loading spinner during processing
- Progress percentage
- Extracted text preview
- Confidence indicator

### Review & Edit Screen
- Side-by-side: Original image + Extracted text
- Inline text editing
- Accept/Reject buttons
- Retry with different settings

---

## Out of Scope

### Phase 1 (MVP)
- ❌ Real-time camera capture
- ❌ PDF processing
- ❌ Handwriting recognition training
- ❌ Table structure preservation
- ❌ Multi-language auto-detection
- ❌ Cloud OCR fallback

### Future Considerations
- LLM-based OCR correction (Ollama + LLaVA)
- Receipt/invoice parsing
- Form field extraction
- Mathematical notation recognition

---

## Competitive Analysis

| Feature | CoBrain | Notion | Evernote | Google Keep |
|---------|---------|--------|----------|-------------|
| Image OCR | ✅ Planned | ❌ | ✅ | ✅ |
| Local Processing | ✅ | N/A | ❌ | ❌ |
| PDF OCR | ⏳ Phase 2 | ❌ | ✅ | ❌ |
| Handwriting | ✅ Basic | ❌ | ✅ | ✅ |
| Entity Extraction | ✅ | ❌ | ❌ | ❌ |
| Offline OCR | ✅ | ❌ | ❌ | ❌ |

### Competitive Advantages
1. **Privacy-First**: Local processing, no cloud upload
2. **Entity Integration**: Extracted text feeds into knowledge graph
3. **Offline Capable**: Works without internet

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Poor handwriting accuracy | High | Medium | Set expectations, show confidence scores |
| Large bundle size | Medium | Low | Lazy-load Tesseract, use CDN for lang data |
| Processing performance | Medium | Medium | Use web workers, show progress |
| Memory issues on mobile | Medium | Medium | Resize large images before processing |

---

## Success Criteria

### MVP Launch
- [ ] Users can upload images and extract text
- [ ] Extracted text creates searchable notes
- [ ] Processing completes in < 10 seconds
- [ ] 90%+ accuracy on printed English text

### 30-Day Success
- [ ] 30% of active users try OCR feature
- [ ] < 10% OCR error report rate
- [ ] Average satisfaction > 4/5 stars

---

## Implementation Phases

### Phase 1: MVP (This Issue)
1. Create `@cobrain/ocr` package
2. Implement Tesseract.js wrapper
3. Add image upload to web app
4. Integrate with note creation
5. Basic UI for OCR workflow

### Phase 2: Enhancement
1. PDF support
2. Mobile camera capture
3. Batch processing
4. Additional languages

### Phase 3: Advanced
1. LLM-based correction
2. Structured data extraction
3. Handwriting model fine-tuning

---

## References

- [Tesseract.js Documentation](https://github.com/naptha/tesseract.js)
- [Scribe.js - Alternative with PDF support](https://github.com/scribeocr/scribe.js)
- GitHub Issue #51

---

**Approval Requested**: Ready for implementation?
