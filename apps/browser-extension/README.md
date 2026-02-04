# CoBrain Browser Extension

Quick capture notes and web content to CoBrain from any webpage.

## Features

- **Quick Capture Popup** - Click the extension icon to capture notes
- **Keyboard Shortcut** - `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac) for quick capture
- **Right-Click Context Menu** - Capture selected text, links, or images
- **Page Capture** - Capture entire page content with one click
- **Selection Capture** - Capture highlighted text
- **Recent Captures** - View your last 3 captures in the popup

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `apps/browser-extension` folder

### Icon Generation

The extension requires PNG icons. Generate them from the SVG files:

```bash
# Using ImageMagick
convert icons/icon16.svg icons/icon16.png
convert icons/icon48.svg icons/icon48.png
convert icons/icon128.svg icons/icon128.png

# Or create a simple 32x32 icon
convert icons/icon48.svg -resize 32x32 icons/icon32.png
```

Alternatively, create PNG icons manually (16x16, 32x32, 48x48, 128x128) with the CoBrain brain emoji (🧠) on a blue-purple gradient background.

## Usage

1. **Sign in to CoBrain** - Make sure you're logged in at http://localhost:3000
2. **Click the extension icon** - Opens the capture popup
3. **Enter or paste content** - Type notes or use quick actions
4. **Click "Capture to CoBrain"** - Saves the note

### Quick Actions

- **Capture Selection** - Grabs highlighted text from the page
- **Capture Page** - Extracts the main content of the page

### Keyboard Shortcuts

- `Ctrl+Shift+C` / `Cmd+Shift+C` - Open quick capture with selection
- `Alt+Shift+C` - Open capture overlay on the page

### Context Menu

Right-click on:
- Selected text → "Capture to CoBrain"
- Links → "Capture Link to CoBrain"
- Images → "Capture Image to CoBrain"

## Configuration

The extension connects to `http://localhost:3000` by default. For production, update `API_BASE` in `popup.js` and `background.js`.

## Permissions

- `activeTab` - Access current tab info and content
- `storage` - Store recent captures locally
- `contextMenus` - Right-click menu integration
- `notifications` - Show capture confirmations
- `scripting` - Execute scripts to capture page content

## Troubleshooting

**"Not connected" status:**
- Ensure CoBrain is running at http://localhost:3000
- Check that you're logged in to CoBrain

**Keyboard shortcut not working:**
- Check `chrome://extensions/shortcuts` for conflicts
- The shortcut may be overridden by another extension

**Cannot capture on certain pages:**
- Chrome extensions cannot run on `chrome://` pages
- Some sites block content scripts
