# CoBrain Desktop Application

Native desktop application for CoBrain built with Tauri v2.

## Features

- **System Tray** - Always accessible from system tray
- **Global Shortcut** - `Ctrl+Shift+Space` to quick capture from any app
- **Native Notifications** - System-level reminder alerts
- **Auto-Start** - Optional launch on system startup
- **Cross-Platform** - Windows, macOS, and Linux support

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- Platform-specific requirements:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `webkit2gtk`, `libayatana-appindicator`

## Development

1. Start the web app in development mode:
   ```bash
   cd ../web
   npm run dev
   ```

2. In a separate terminal, start the desktop app:
   ```bash
   npm run dev
   ```

## Building

Build for production:

```bash
npm run build
```

This will create installers in `src-tauri/target/release/bundle/`:
- **Windows**: `.msi` and `.exe`
- **macOS**: `.dmg` and `.app`
- **Linux**: `.deb`, `.AppImage`, and `.rpm`

## Configuration

Edit `src-tauri/tauri.conf.json` to customize:
- Window settings (size, title, etc.)
- Tray icon behavior
- Bundle settings (icons, app name)
- Plugin permissions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Space` | Quick Capture (global) |
| `Ctrl+Q` | Quit application |

## Architecture

```
apps/desktop/
├── package.json          # Node.js dependencies
├── src-tauri/
│   ├── Cargo.toml       # Rust dependencies
│   ├── tauri.conf.json  # Tauri configuration
│   ├── build.rs         # Build script
│   ├── src/
│   │   ├── main.rs      # Application entry point
│   │   └── tray.rs      # System tray implementation
│   └── icons/           # App icons for all platforms
└── README.md
```

## License

AGPL-3.0 - See root LICENSE file.
