#!/bin/bash
# Build web app as static export for desktop (Tauri)
# Temporarily moves server-only routes, middleware, and dynamic pages out
# since they don't work with output: 'export'

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$WEB_DIR/src/app"
BACKUP_DIR="$WEB_DIR/.static-build-backup"

echo "=== Building static export for desktop ==="

# Clean up any previous backup
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Track items to restore
MOVED_ITEMS=()

move_aside() {
  local src="$1"
  local name="$2"
  local dst="$BACKUP_DIR/$name"
  if [ -e "$src" ]; then
    mv "$src" "$dst"
    MOVED_ITEMS+=("$dst|$src")
    echo "  Moved: $src -> $dst"
  fi
}

restore_all() {
  echo "Restoring moved items..."
  for item in "${MOVED_ITEMS[@]}"; do
    IFS='|' read -r dst src <<< "$item"
    if [ -e "$dst" ]; then
      # Ensure parent directory exists
      mkdir -p "$(dirname "$src")"
      mv "$dst" "$src"
      echo "  Restored: $src"
    fi
  done
  rm -rf "$BACKUP_DIR"
}

# Set up trap to always restore on exit
trap restore_all EXIT

echo "Moving server-only content aside..."

# API routes (server-only)
move_aside "$APP_DIR/api" "api"

# Middleware (server-only auth)
move_aside "$WEB_DIR/src/middleware.ts" "middleware.ts"

# Dynamic server pages (need server-side data fetching)
move_aside "$APP_DIR/shared" "shared"

# Dynamic client pages without generateStaticParams
move_aside "$APP_DIR/(app)/views/[id]" "views-id"

# Clean previous build
rm -rf "$WEB_DIR/.next" "$WEB_DIR/out"

# Build with static export
echo "Running Next.js build with STATIC_EXPORT=true..."
STATIC_EXPORT=true npx next build

echo "=== Static export complete: apps/web/out ==="
