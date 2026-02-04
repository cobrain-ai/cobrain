// CoBrain Browser Extension - Background Service Worker

const API_BASE = 'http://localhost:3000'

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-capture') {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab?.id) return

    // Try to get selected text from the page
    try {
      const [{ result: selection }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || '',
      })

      if (selection) {
        // If there's a selection, capture it directly
        await quickCapture(selection, tab)
      } else {
        // Otherwise, show the popup or content overlay
        await chrome.action.openPopup()
      }
    } catch (error) {
      // If we can't execute script (e.g., chrome:// pages), just open popup
      console.error('Quick capture failed:', error)
      await chrome.action.openPopup()
    }
  }
})

// Quick capture function
async function quickCapture(content, tab) {
  try {
    // Check if user is authenticated
    const sessionResponse = await fetch(`${API_BASE}/api/auth/session`, {
      credentials: 'include',
    })

    if (!sessionResponse.ok) {
      // Not authenticated, show notification
      await showNotification('Not Signed In', 'Please sign in to CoBrain to capture notes.')
      return
    }

    const session = await sessionResponse.json()
    if (!session.user) {
      await showNotification('Not Signed In', 'Please sign in to CoBrain to capture notes.')
      return
    }

    // Build note content with source
    let noteContent = content
    if (tab?.url) {
      noteContent += `\n\nSource: ${tab.url}`
    }

    // Send to CoBrain
    const response = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        content: noteContent,
        source: 'browser-extension',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to capture note')
    }

    // Save to recent captures
    await saveToRecent(content, tab?.url)

    // Show success notification
    await showNotification('Captured!', content.slice(0, 50) + (content.length > 50 ? '...' : ''))

  } catch (error) {
    console.error('Quick capture failed:', error)
    await showNotification('Capture Failed', 'Could not save to CoBrain. Please try again.')
  }
}

// Save to recent captures in local storage
async function saveToRecent(content, url) {
  const { recentCaptures = [] } = await chrome.storage.local.get('recentCaptures')

  const newCapture = {
    content: content.slice(0, 100),
    timestamp: Date.now(),
    url: url,
  }

  const updated = [newCapture, ...recentCaptures].slice(0, 10)
  await chrome.storage.local.set({ recentCaptures: updated })
}

// Show browser notification
async function showNotification(title, message) {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
  })
}

// Context menu for right-click capture
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for selected text
  chrome.contextMenus.create({
    id: 'capture-selection',
    title: 'Capture to CoBrain',
    contexts: ['selection'],
  })

  // Create context menu for links
  chrome.contextMenus.create({
    id: 'capture-link',
    title: 'Capture Link to CoBrain',
    contexts: ['link'],
  })

  // Create context menu for images
  chrome.contextMenus.create({
    id: 'capture-image',
    title: 'Capture Image to CoBrain',
    contexts: ['image'],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let content = ''

  switch (info.menuItemId) {
    case 'capture-selection':
      content = info.selectionText || ''
      break
    case 'capture-link':
      content = `[${info.linkUrl}](${info.linkUrl})`
      break
    case 'capture-image':
      content = `![Image](${info.srcUrl})`
      break
  }

  if (content) {
    await quickCapture(content, tab)
  }
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_NOTE') {
    quickCapture(message.content, message.tab)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true // Keep channel open for async response
  }

  if (message.type === 'CHECK_AUTH') {
    checkAuth()
      .then((isAuthenticated) => sendResponse({ isAuthenticated }))
      .catch(() => sendResponse({ isAuthenticated: false }))
    return true
  }
})

// Check authentication status
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/session`, {
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      return !!data.user
    }
    return false
  } catch {
    return false
  }
}
