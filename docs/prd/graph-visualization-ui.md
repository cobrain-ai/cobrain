# PRD: Knowledge Graph Visualization UI

**Author**: Product Design Agent
**Date**: 2026-02-04
**Status**: Implemented
**Priority**: P0 - MVP Required
**Implementation Date**: 2026-02-04

---

## Executive Summary

Implement an interactive knowledge graph visualization UI that allows users to visually explore their notes, entities, and relationships. This is the final P0 feature required to complete the CoBrain MVP according to the roadmap.

The backend graph API and data structures already exist - this PRD covers only the frontend visualization component.

---

## Problem Statement

### Current State
- CoBrain has a complete graph backend with traversal algorithms
- Graph API endpoints exist for stats, neighbors, paths, hubs, and more
- The Views system defines "graph" as a layout option
- **No UI exists to visualize the knowledge graph**

### User Pain Points
1. Users cannot see connections between their notes and entities
2. Discovering relationships requires manual querying via chat
3. No visual way to explore the knowledge graph
4. Hidden insights in entity relationships remain undiscovered

### Competitive Gap
| Feature | CoBrain | Obsidian | Roam Research | Mem.ai |
|---------|---------|----------|---------------|--------|
| Graph Visualization | ❌ Missing | ✅ Core feature | ✅ Core feature | ❌ No |

---

## Goals & Objectives

### Primary Goals
1. **Visualize** the knowledge graph with nodes (entities) and edges (relationships)
2. **Enable exploration** via interactive navigation (click, zoom, pan)
3. **Surface connections** users didn't know existed
4. **Complete MVP** roadmap milestone

### Success Metrics
- Users can view their knowledge graph within 2 clicks from any page
- Graph loads with < 2 second latency for typical graphs (< 500 nodes)
- 50% of users explore graph within first week
- Graph helps discover at least 3 previously unknown connections per user

---

## User Stories

### US-1: View Knowledge Graph
**As a** CoBrain user
**I want to** see my knowledge graph visually
**So that** I can understand how my notes and entities are connected

**Acceptance Criteria:**
- [ ] Nodes display entities with type-based colors
- [ ] Edges show relationships between entities
- [ ] Graph renders within 2 seconds
- [ ] Works on desktop and tablet screens

### US-2: Navigate the Graph
**As a** CoBrain user
**I want to** zoom, pan, and click nodes
**So that** I can explore different parts of my graph

**Acceptance Criteria:**
- [ ] Mouse wheel zoom in/out
- [ ] Click and drag to pan
- [ ] Click node to select and show details
- [ ] Double-click node to center and expand neighbors

### US-3: Filter Graph View
**As a** CoBrain user
**I want to** filter the graph by entity type or search
**So that** I can focus on specific areas of interest

**Acceptance Criteria:**
- [ ] Filter by entity type (person, project, place, etc.)
- [ ] Search to highlight matching nodes
- [ ] Toggle to show/hide certain relationship types
- [ ] Apply existing view filters to graph

### US-4: View Node Details
**As a** CoBrain user
**I want to** see details about a selected node
**So that** I can understand what it represents

**Acceptance Criteria:**
- [ ] Sidebar or panel shows selected entity details
- [ ] Display entity name, type, and metadata
- [ ] List connected entities with relationship types
- [ ] Link to related notes

### US-5: Discover Paths
**As a** CoBrain user
**I want to** find paths between two entities
**So that** I can discover how things are connected

**Acceptance Criteria:**
- [ ] Select two nodes to find path between them
- [ ] Highlight path visually on graph
- [ ] Show path length and relationship types
- [ ] Handle "no path found" gracefully

---

## Feature Specifications

### Core Features (P0)

#### 1. Graph Canvas
- **Description**: Main visualization area with force-directed layout
- **Priority**: P0
- **Library**: React Flow (recommended) or D3.js

#### 2. Node Rendering
- **Description**: Visual representation of entities
- **Priority**: P0
- **Specs**:
  - Color-coded by entity type
  - Size based on connection count (degree)
  - Label with entity name
  - Icon for entity type

#### 3. Edge Rendering
- **Description**: Visual representation of relationships
- **Priority**: P0
- **Specs**:
  - Lines connecting related nodes
  - Directional arrows for asymmetric relations
  - Color/style based on relationship type

#### 4. Basic Interactions
- **Description**: Navigation and selection
- **Priority**: P0
- **Specs**:
  - Zoom (mouse wheel, pinch)
  - Pan (drag background)
  - Select node (click)
  - Center on node (double-click)

#### 5. Node Details Panel
- **Description**: Information about selected node
- **Priority**: P0
- **Specs**:
  - Slide-in panel or sidebar
  - Entity name, type, metadata
  - List of connections
  - Links to notes containing entity

### Enhanced Features (P1)

#### 6. Filtering Controls
- **Description**: Filter visible nodes/edges
- **Priority**: P1
- **Specs**:
  - Entity type checkboxes
  - Relationship type toggles
  - Search/highlight
  - Date range filter

#### 7. Path Finding UI
- **Description**: Find and highlight paths
- **Priority**: P1
- **Specs**:
  - Multi-select mode for choosing endpoints
  - Path highlighting
  - Path summary

#### 8. Layout Options
- **Description**: Different graph layout algorithms
- **Priority**: P1
- **Options**:
  - Force-directed (default)
  - Hierarchical
  - Radial
  - Grid

### Future Features (P2)

#### 9. Graph Persistence
- **Description**: Save graph view positions
- **Priority**: P2

#### 10. Collaborative Annotations
- **Description**: Add notes to graph elements
- **Priority**: P2

---

## Technical Requirements

### Frontend Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Use React Flow or similar for graph rendering |
| FR-2 | Integrate with existing `/api/graph` endpoints |
| FR-3 | Support the Views system "graph" layout |
| FR-4 | Responsive design (desktop, tablet) |
| FR-5 | TypeScript strict mode compliance |
| FR-6 | Tailwind CSS for styling consistency |

### Performance Requirements

| ID | Requirement |
|----|-------------|
| PR-1 | Render < 500 nodes in < 2 seconds |
| PR-2 | Smooth 60fps interactions (zoom, pan) |
| PR-3 | Lazy load large graphs (> 500 nodes) |
| PR-4 | Virtual rendering for very large graphs |

### API Integration

Use existing endpoints:
- `GET /api/graph?action=stats` - Get graph statistics
- `GET /api/graph?action=hubs&limit=N` - Get top connected nodes
- `GET /api/graph?action=neighborhood&entityId=X` - Get node neighbors
- `GET /api/graph?action=path&fromId=X&toId=Y` - Find path between nodes

---

## UI/UX Specifications

### Entity Type Colors

| Type | Color | Hex |
|------|-------|-----|
| person | Blue | #3B82F6 |
| organization | Purple | #8B5CF6 |
| place | Green | #10B981 |
| project | Orange | #F59E0B |
| task | Red | #EF4444 |
| concept | Cyan | #06B6D4 |
| date | Gray | #6B7280 |
| time | Gray | #6B7280 |
| custom | Pink | #EC4899 |

### Edge Styles

| Type | Style |
|------|-------|
| mentions | Solid, directed |
| related_to | Dashed |
| part_of | Solid, thick |
| depends_on | Dotted, directed |
| assigned_to | Solid, directed |

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Graph View                           [Filters] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                     Graph Canvas                            │
│                   (Force-directed)                          │
│                                                             │
│                       [○]──[○]                              │
│                      / │ \   │                              │
│                   [○] [○] [○][○]                            │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Footer: Stats: 127 nodes, 284 edges    Zoom: 100%    [Fit] │
└─────────────────────────────────────────────────────────────┘
```

With selected node:

```
┌───────────────────────────────────────┬─────────────────────┐
│ Header: Graph View         [Filters]  │ Selected: John Doe  │
├───────────────────────────────────────┤ Type: person        │
│                                       │                     │
│                                       │ Connections (12):   │
│            Graph Canvas               │ • Alice (mentions)  │
│                                       │ • Project X (works) │
│           [○]──[●]                    │ • Acme Corp (works) │
│          /      │                     │ ...                 │
│       [○]      [○]                    │                     │
│                                       │ In 5 notes:         │
│                                       │ • Meeting notes...  │
│                                       │ • Project plan...   │
├───────────────────────────────────────┴─────────────────────┤
│ Stats: 127 nodes, 284 edges           Zoom: 100%     [Fit] │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependencies

### New Dependencies
- `reactflow` - Graph visualization library
- `@xyflow/react` - React Flow v12 (latest)
- `elkjs` (optional) - Advanced layout algorithms

### Existing Dependencies (reuse)
- `tailwindcss` - Styling
- `@cobrain/ui` - UI components
- `@cobrain/database` - Graph repository

---

## Out of Scope

- 3D graph visualization
- Graph editing (create/delete nodes via UI)
- Collaborative real-time graph viewing
- Export graph as image/PDF
- Graph animations beyond basic transitions

---

## Implementation Plan

### Phase 1: Core Graph Canvas (Day 1-2)
1. Install React Flow dependency
2. Create GraphView component
3. Fetch graph data from API
4. Render nodes and edges with basic styling

### Phase 2: Interactions (Day 2-3)
1. Implement zoom/pan controls
2. Add node selection
3. Create node details panel
4. Add keyboard shortcuts

### Phase 3: Filtering & Polish (Day 3-4)
1. Add entity type filters
2. Add search/highlight
3. Style refinements
4. Performance optimization

### Phase 4: Testing & Integration (Day 4-5)
1. Unit tests for components
2. Integration with Views system
3. E2E tests
4. Documentation

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance with large graphs | Medium | High | Lazy loading, virtual rendering |
| React Flow learning curve | Low | Medium | Good documentation available |
| Complex layout algorithms | Medium | Medium | Use built-in layouts first |
| Mobile responsiveness | Low | Low | Defer mobile to P1 |

---

## Competitive Analysis

### Obsidian Graph View
- **Strengths**: Fast, interactive, customizable
- **Weaknesses**: Can be overwhelming with many notes
- **Takeaway**: Need filtering and zoom controls

### Roam Research Graph
- **Strengths**: Beautiful, bidirectional links visible
- **Weaknesses**: Less interactive than Obsidian
- **Takeaway**: Focus on relationship visibility

### Neo4j Bloom
- **Strengths**: Professional, powerful querying
- **Weaknesses**: Complex for casual users
- **Takeaway**: Keep UI simple, power features optional

---

## References

- [React Flow Documentation](https://reactflow.dev/)
- [Cambridge Intelligence - React Graph Visualization](https://cambridge-intelligence.com/react-graph-visualization-library/)
- [Cytoscape.js](https://js.cytoscape.org/)
- [D3.js Force Layout](https://d3js.org/)
- [Obsidian Graph View](https://help.obsidian.md/Plugins/Graph+view)

---

## Appendix: API Response Examples

### Graph Stats
```json
{
  "totalNodes": 127,
  "totalEdges": 284,
  "nodesByType": {
    "person": 45,
    "project": 12,
    "concept": 35,
    "place": 20,
    "organization": 15
  },
  "avgDegree": 4.47
}
```

### Neighborhood Response
```json
{
  "center": {
    "id": "entity-123",
    "type": "person",
    "name": "John Doe"
  },
  "neighbors": [
    {
      "entity": { "id": "entity-456", "type": "project", "name": "Project X" },
      "relation": { "type": "works_on", "weight": 1.0 },
      "direction": "outgoing"
    }
  ]
}
```

---

**End of Document**

---

## Implementation Notes (2026-02-04)

### Completed Features
- React Flow-based graph visualization with custom nodes/edges
- EntityNode component with type-based colors and icons
- RelationEdge component with styled relationship types
- GraphControls with entity type filtering and search
- EntityDetailsPanel showing selected entity information
- GraphView main component integrating all features
- Navigation added to sidebar

### Test Coverage
- 129 unit tests passing across 6 test files
- Components: types, EntityNode, RelationEdge, GraphControls, EntityDetailsPanel, GraphView

### Code Quality Improvements Applied
- URLSearchParams for secure API calls
- Extracted magic numbers to named constants
- Individual error handling for neighborhood fetches
- Removed unlicensed proOptions

### Known Limitations
- Path finding UI (US-5) not yet implemented (P1)
- No keyboard navigation for graph nodes (accessibility improvement)
- No loading state for details panel
