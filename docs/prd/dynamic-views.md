# PRD: Dynamic Views UI with Templates

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**GitHub Issue**: #37

---

## Executive Summary

Complete the Dynamic Views feature with a full UI allowing users to create, customize, and use auto-updating filtered views with pre-built templates. This enables users to organize their knowledge into meaningful collections without manual categorization.

---

## Problem Statement

The backend infrastructure for views exists (API, database, templates) but users cannot:
- Access or create views from the UI
- See their notes rendered in different layouts (Kanban, Grid, Timeline)
- Use pre-built view templates
- Save or share views

---

## Implementation Scope

### What's Already Built
- Views repository with CRUD operations
- View query execution engine
- Pre-defined templates (Projects, Tasks, People, Timeline, Recent, Pinned)
- API endpoints for all view operations
- Database schema for views and snapshots

### What Needs to Be Built
- Views page (`/views`) with view list and creation
- View detail page (`/views/[id]`) with layout rendering
- Template picker modal
- Layout components: List, Grid, Kanban, Timeline
- View settings panel
- Sidebar integration

---

## User Stories

### US-1: Access Views from Sidebar
**As a** user navigating CoBrain
**I want** to see my saved views in the sidebar
**So that** I can quickly access organized collections

### US-2: Create View from Template
**As a** new user
**I want** to create a view from a pre-built template
**So that** I can start organizing without configuration

### US-3: Custom View Creation
**As a** power user
**I want** to create custom views with filters
**So that** I can organize notes my way

### US-4: Switch Layouts
**As a** user viewing notes
**I want** to switch between List, Grid, Kanban, and Timeline layouts
**So that** I can visualize data appropriately

---

## Technical Implementation

### Files to Create

1. `apps/web/src/app/(app)/views/page.tsx` - Views list page
2. `apps/web/src/app/(app)/views/[id]/page.tsx` - View detail page
3. `apps/web/src/components/views/view-list.tsx` - View list component
4. `apps/web/src/components/views/view-card.tsx` - View card
5. `apps/web/src/components/views/template-picker.tsx` - Template selection modal
6. `apps/web/src/components/views/layouts/list-layout.tsx` - List view
7. `apps/web/src/components/views/layouts/grid-layout.tsx` - Grid view
8. `apps/web/src/components/views/layouts/kanban-layout.tsx` - Kanban view
9. `apps/web/src/components/views/layouts/timeline-layout.tsx` - Timeline view
10. `apps/web/src/components/views/view-settings.tsx` - Settings panel

### Files to Modify
1. `apps/web/src/components/layout/sidebar.tsx` - Add views section

---

**End of PRD**
