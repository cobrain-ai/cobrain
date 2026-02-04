# PRD: Static View Snapshots

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**GitHub Issue**: #42

---

## Executive Summary

Add the ability to freeze a dynamic view at a point in time, creating a read-only snapshot for archival, comparison, or sharing purposes.

---

## Problem Statement

Dynamic views are great for real-time filtered collections, but users need:
- Point-in-time captures for reporting
- Historical comparisons of view states
- Archival of important milestones
- Read-only views for sharing context

---

## Features Implemented

### Core Features

1. **Snapshot Creation**
   - "Save Snapshot" button on view detail page
   - Optional custom name (defaults to date)
   - Captures current notes and view settings

2. **Snapshot Panel**
   - Collapsible panel showing all snapshots for a view
   - Create, view, and delete snapshots
   - Shows creation date and note count

3. **Snapshot Detail Page**
   - Read-only view of frozen data
   - Visual indicator that it's a snapshot
   - Information banner with capture date
   - All layout options available (List, Grid, Kanban, Timeline)

### API Endpoints

- `GET /api/views/[id]/snapshots` - List all snapshots for a view
- `POST /api/views/[id]/snapshots` - Create a new snapshot
- `GET /api/views/[id]/snapshots/[snapshotId]` - Get snapshot details
- `PATCH /api/views/[id]/snapshots/[snapshotId]` - Rename snapshot
- `DELETE /api/views/[id]/snapshots/[snapshotId]` - Delete snapshot

### Database

The `ViewSnapshot` model already existed in Prisma schema:
```prisma
model ViewSnapshot {
  id        String   @id @default(uuid())
  viewId    String
  name      String?
  data      Json     // Frozen view data at this point
  createdAt DateTime @default(now())

  view View @relation(fields: [viewId], references: [id], onDelete: Cascade)
}
```

---

## Files Created

- `apps/web/src/app/api/views/[id]/snapshots/route.ts` - List and create snapshots
- `apps/web/src/app/api/views/[id]/snapshots/[snapshotId]/route.ts` - CRUD operations
- `apps/web/src/components/views/snapshot-panel.tsx` - UI component
- `apps/web/src/app/(app)/views/[id]/snapshots/[snapshotId]/page.tsx` - Detail page

## Files Modified

- `apps/web/src/app/(app)/views/[id]/page.tsx` - Added snapshot integration
- `apps/web/src/components/views/index.ts` - Added SnapshotPanel export

---

## Future Enhancements (P2)

- [ ] Comparison view (snapshot vs current)
- [ ] Export snapshot to Markdown/JSON/PDF
- [ ] Snapshot sharing with public link
- [ ] Snapshot annotations

---

**End of PRD**
