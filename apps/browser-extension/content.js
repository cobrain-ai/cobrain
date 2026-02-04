// CoBrain Browser Extension - Content Script

// Overlay UI state
let overlayVisible = false
let overlay = null

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_CAPTURE_OVERLAY') {
    showCaptureOverlay(message.selection)
    sendResponse({ success: true })
  }

  if (message.type === 'HIDE_CAPTURE_OVERLAY') {
    hideCaptureOverlay()
    sendResponse({ success: true })
  }
})

// Show capture overlay on the page
function showCaptureOverlay(initialText = '') {
  if (overlayVisible) {
    hideCaptureOverlay()
  }

  // Create overlay container
  overlay = document.createElement('div')
  overlay.id = 'cobrain-capture-overlay'
  overlay.innerHTML = `
    <div class="cobrain-overlay-backdrop"></div>
    <div class="cobrain-capture-modal">
      <div class="cobrain-modal-header">
        <span class="cobrain-logo">🧠</span>
        <span class="cobrain-title">Capture to CoBrain</span>
        <button class="cobrain-close-btn" aria-label="Close">×</button>
      </div>
      <div class="cobrain-modal-body">
        <textarea
          class="cobrain-capture-input"
          placeholder="Type or paste content to capture..."
          rows="5"
        >${escapeHtml(initialText)}</textarea>
        <div class="cobrain-page-info">
          <span class="cobrain-page-title">${escapeHtml(document.title)}</span>
        </div>
      </div>
      <div class="cobrain-modal-footer">
        <button class="cobrain-cancel-btn">Cancel</button>
        <button class="cobrain-capture-btn">
          <span>📥</span>
          <span>Capture</span>
        </button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
  overlayVisible = true

  // Focus the textarea
  const textarea = overlay.querySelector('.cobrain-capture-input')
  textarea.focus()
  textarea.setSelectionRange(textarea.value.length, textarea.value.length)

  // Event listeners
  const closeBtn = overlay.querySelector('.cobrain-close-btn')
  const cancelBtn = overlay.querySelector('.cobrain-cancel-btn')
  const captureBtn = overlay.querySelector('.cobrain-capture-btn')
  const backdrop = overlay.querySelector('.cobrain-overlay-backdrop')

  closeBtn.addEventListener('click', hideCaptureOverlay)
  cancelBtn.addEventListener('click', hideCaptureOverlay)
  backdrop.addEventListener('click', hideCaptureOverlay)

  captureBtn.addEventListener('click', async () => {
    const content = textarea.value.trim()
    if (!content) {
      textarea.classList.add('cobrain-error')
      setTimeout(() => textarea.classList.remove('cobrain-error'), 500)
      return
    }

    captureBtn.disabled = true
    captureBtn.innerHTML = '<span>⏳</span><span>Capturing...</span>'

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_NOTE',
        content: content,
        tab: {
          url: window.location.href,
          title: document.title,
        },
      })

      if (response.success) {
        captureBtn.innerHTML = '<span>✓</span><span>Captured!</span>'
        captureBtn.classList.add('cobrain-success')
        setTimeout(hideCaptureOverlay, 1000)
      } else {
        throw new Error(response.error || 'Failed to capture')
      }
    } catch (error) {
      console.error('Capture failed:', error)
      captureBtn.innerHTML = '<span>❌</span><span>Failed</span>'
      captureBtn.disabled = false
      setTimeout(() => {
        captureBtn.innerHTML = '<span>📥</span><span>Capture</span>'
      }, 2000)
    }
  })

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown)
}

// Hide capture overlay
function hideCaptureOverlay() {
  if (overlay) {
    overlay.remove()
    overlay = null
    overlayVisible = false
    document.removeEventListener('keydown', handleKeydown)
  }
}

// Handle keyboard events
function handleKeydown(e) {
  if (e.key === 'Escape') {
    hideCaptureOverlay()
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const captureBtn = overlay?.querySelector('.cobrain-capture-btn')
    if (captureBtn && !captureBtn.disabled) {
      captureBtn.click()
    }
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Initialize - add keyboard shortcut listener for quick capture
document.addEventListener('keydown', (e) => {
  // Alt+Shift+C to open capture overlay with selection
  if (e.altKey && e.shiftKey && e.key === 'C') {
    e.preventDefault()
    const selection = window.getSelection()?.toString() || ''
    showCaptureOverlay(selection)
  }
})
