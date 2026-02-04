// CoBrain Browser Extension - Popup Script

const API_BASE = 'http://localhost:3000'

// DOM Elements
const statusDot = document.getElementById('status-dot')
const statusText = document.getElementById('status-text')
const captureArea = document.getElementById('capture-area')
const loginArea = document.getElementById('login-area')
const captureForm = document.getElementById('capture-form')
const captureText = document.getElementById('capture-text')
const captureBtn = document.getElementById('capture-btn')
const pageTitle = document.getElementById('page-title')
const pageFavicon = document.getElementById('page-favicon')
const recentList = document.getElementById('recent-list')

// State
let isConnected = false
let currentTab = null

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkConnection()
  await getCurrentTab()
  await loadRecentCaptures()
  setupEventListeners()
})

// Check connection to CoBrain
async function checkConnection() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/session`, {
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      if (data.user) {
        setConnected(true)
        return
      }
    }
    setConnected(false)
  } catch (error) {
    console.error('Connection check failed:', error)
    setConnected(false)
  }
}

function setConnected(connected) {
  isConnected = connected
  statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`
  statusText.textContent = connected ? 'Connected to CoBrain' : 'Not connected'
  captureArea.style.display = connected ? 'block' : 'none'
  loginArea.style.display = connected ? 'none' : 'block'
}

// Get current tab info
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  currentTab = tab

  if (tab) {
    pageTitle.textContent = tab.title || 'Untitled'
    pageFavicon.src = tab.favIconUrl || ''
    pageFavicon.style.display = tab.favIconUrl ? 'block' : 'none'
  }
}

// Load recent captures from storage
async function loadRecentCaptures() {
  const { recentCaptures = [] } = await chrome.storage.local.get('recentCaptures')

  if (recentCaptures.length === 0) {
    recentList.innerHTML = '<div class="recent-item" style="color: #94a3b8;">No recent captures</div>'
    return
  }

  recentList.innerHTML = recentCaptures
    .slice(0, 3)
    .map(
      (capture) =>
        `<div class="recent-item" title="${capture.content}">${capture.content}</div>`
    )
    .join('')
}

// Save to recent captures
async function saveToRecent(content) {
  const { recentCaptures = [] } = await chrome.storage.local.get('recentCaptures')

  const newCapture = {
    content: content.slice(0, 100),
    timestamp: Date.now(),
    url: currentTab?.url,
  }

  const updated = [newCapture, ...recentCaptures].slice(0, 10)
  await chrome.storage.local.set({ recentCaptures: updated })
  await loadRecentCaptures()
}

// Setup event listeners
function setupEventListeners() {
  // Form submission
  captureForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    await captureNote()
  })

  // Quick actions
  document.getElementById('capture-selection').addEventListener('click', async () => {
    const selection = await getSelectedText()
    if (selection) {
      captureText.value = selection
    }
  })

  document.getElementById('capture-page').addEventListener('click', async () => {
    const pageContent = await getPageContent()
    if (pageContent) {
      captureText.value = `# ${currentTab?.title}\n\n${pageContent}\n\nSource: ${currentTab?.url}`
    }
  })
}

// Get selected text from page
async function getSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || '',
    })
    return result
  } catch (error) {
    console.error('Failed to get selection:', error)
    return null
  }
}

// Get page content
async function getPageContent() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get main content (simplified extraction)
        const article = document.querySelector('article')
        const main = document.querySelector('main')
        const body = document.body

        const element = article || main || body
        const text = element?.innerText || ''

        // Limit to first 2000 characters
        return text.slice(0, 2000)
      },
    })
    return result
  } catch (error) {
    console.error('Failed to get page content:', error)
    return null
  }
}

// Capture note to CoBrain
async function captureNote() {
  const content = captureText.value.trim()

  if (!content) {
    alert('Please enter some text to capture')
    return
  }

  if (!isConnected) {
    alert('Please sign in to CoBrain first')
    return
  }

  captureBtn.disabled = true
  captureBtn.innerHTML = '<span>⏳</span><span>Capturing...</span>'

  try {
    // Build note content with source URL
    let noteContent = content
    if (currentTab?.url && !content.includes(currentTab.url)) {
      noteContent += `\n\nSource: ${currentTab.url}`
    }

    const response = await fetch(`${API_BASE}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        content: noteContent,
        source: 'text',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to capture note')
    }

    // Success
    captureBtn.className = 'capture-btn success'
    captureBtn.innerHTML = '<span>✓</span><span>Captured!</span>'

    await saveToRecent(content)

    // Reset after delay
    setTimeout(() => {
      captureText.value = ''
      captureBtn.className = 'capture-btn'
      captureBtn.innerHTML = '<span>📥</span><span>Capture to CoBrain</span>'
      captureBtn.disabled = false
    }, 1500)
  } catch (error) {
    console.error('Capture failed:', error)
    captureBtn.innerHTML = '<span>❌</span><span>Failed - Try Again</span>'
    captureBtn.disabled = false

    setTimeout(() => {
      captureBtn.innerHTML = '<span>📥</span><span>Capture to CoBrain</span>'
    }, 2000)
  }
}
