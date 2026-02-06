'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { Entity, EntityType } from '@cobrain/core'
import { EntityNode } from './entity-node'
import { RelationEdge } from './relation-edge'
import { EntityDetailsPanel } from './entity-details-panel'
import { GraphControls } from './graph-controls'
import type {
  EntityNodeData,
  RelationEdgeData,
  GraphStats,
  GraphNode,
  GraphNeighborhood,
} from './types'
import { ENTITY_TYPE_COLORS } from './types'

const DEFAULT_ENTITY_COLOR = '#6B7280'

// Layout constants
const GRAPH_LAYOUT = {
  HUB_RADIUS: 300,
  NEIGHBOR_RADIUS: 500,
  CENTER_X: 400,
  CENTER_Y: 300,
  NEIGHBOR_ANGLE_SPREAD: 0.3,
  DEFAULT_HUB_LIMIT: 50,
  DEFAULT_NEIGHBORHOOD_DEPTH: 1,
} as const

// View constants
const VIEW_OPTIONS = {
  FIT_PADDING: 0.2,
  ANIMATION_DURATION: 500,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 2,
  CENTER_ZOOM: 1.5,
  BACKGROUND_GAP: 20,
} as const

// Custom node and edge types
const nodeTypes = {
  entity: EntityNode,
}

const edgeTypes = {
  relation: RelationEdge,
}

interface GraphViewProps {
  className?: string
}

export function GraphView({ className = '' }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EntityNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<RelationEdgeData>>([])
  const [stats, setStats] = useState<GraphStats | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<{
    entity: Entity
    degree: number
    inDegree: number
    outDegree: number
    neighbors: GraphNeighborhood['neighbors']
  } | null>(null)
  const [filters, setFilters] = useState<{
    entityTypes: EntityType[]
    search: string
  }>({ entityTypes: [], search: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { fitView, setCenter } = useReactFlow()

  // Build URL with URLSearchParams for API calls
  function buildGraphApiUrl(params: Record<string, string>): string {
    const searchParams = new URLSearchParams(params)
    return `/api/graph?${searchParams.toString()}`
  }

  // Fetch neighborhood for a single hub with error handling
  async function fetchNeighborhood(hub: GraphNode): Promise<GraphNeighborhood | null> {
    try {
      const url = buildGraphApiUrl({
        action: 'neighborhood',
        entityId: hub.entity.id,
        maxDepth: String(GRAPH_LAYOUT.DEFAULT_NEIGHBORHOOD_DEPTH),
      })
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`Failed to fetch neighborhood for ${hub.entity.id}`)
        return null
      }
      const data = await res.json()
      return data.neighborhood as GraphNeighborhood | null
    } catch (err) {
      console.warn(`Error fetching neighborhood for ${hub.entity.id}:`, err)
      return null
    }
  }

  // Fetch graph data
  const fetchGraphData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const statsUrl = buildGraphApiUrl({ action: 'stats' })
      const hubsUrl = buildGraphApiUrl({
        action: 'hubs',
        limit: String(GRAPH_LAYOUT.DEFAULT_HUB_LIMIT),
      })

      const [statsRes, hubsRes] = await Promise.all([
        fetch(statsUrl),
        fetch(hubsUrl),
      ])

      if (!statsRes.ok || !hubsRes.ok) {
        throw new Error('Failed to fetch graph data')
      }

      const statsData = await statsRes.json()
      const hubsData = await hubsRes.json()

      setStats(statsData.stats)

      // If no hubs, show empty state
      if (!hubsData.hubs || hubsData.hubs.length === 0) {
        setNodes([])
        setEdges([])
        setIsLoading(false)
        return
      }

      // Fetch neighborhoods for all hub nodes with individual error handling
      const neighborhoodPromises = hubsData.hubs.map((hub: GraphNode) =>
        fetchNeighborhood(hub)
      )

      const neighborhoods = await Promise.all(neighborhoodPromises)

      // Build nodes and edges from hub data and neighborhoods
      const nodeMap = new Map<string, Node<EntityNodeData>>()
      const edgeMap = new Map<string, Edge<RelationEdgeData>>()

      // Add hub nodes
      const hubCount = hubsData.hubs.length
      hubsData.hubs.forEach((hub: GraphNode, index: number) => {
        const angle = (2 * Math.PI * index) / hubCount
        nodeMap.set(hub.entity.id, {
          id: hub.entity.id,
          type: 'entity',
          position: {
            x: Math.cos(angle) * GRAPH_LAYOUT.HUB_RADIUS + GRAPH_LAYOUT.CENTER_X,
            y: Math.sin(angle) * GRAPH_LAYOUT.HUB_RADIUS + GRAPH_LAYOUT.CENTER_Y,
          },
          data: {
            entity: hub.entity,
            degree: hub.degree,
            inDegree: hub.inDegree,
            outDegree: hub.outDegree,
          },
        })
      })

      // Add neighbors and edges from neighborhoods
      const validNeighborhoods = neighborhoods.filter((n): n is GraphNeighborhood => Boolean(n))
      const neighborhoodCount = validNeighborhoods.length

      validNeighborhoods.forEach((neighborhood, hubIndex) => {
        if (!neighborhood) return

        const neighborCount = neighborhood.neighbors.length
        neighborhood.neighbors.forEach((neighbor, neighborIndex) => {
          // Add neighbor node if not already present
          if (!nodeMap.has(neighbor.entity.id)) {
            const hubAngle = (2 * Math.PI * hubIndex) / neighborhoodCount
            const angleOffset = (neighborIndex - neighborCount / 2) * GRAPH_LAYOUT.NEIGHBOR_ANGLE_SPREAD
            const neighborAngle = hubAngle + angleOffset

            nodeMap.set(neighbor.entity.id, {
              id: neighbor.entity.id,
              type: 'entity',
              position: {
                x: Math.cos(neighborAngle) * GRAPH_LAYOUT.NEIGHBOR_RADIUS + GRAPH_LAYOUT.CENTER_X,
                y: Math.sin(neighborAngle) * GRAPH_LAYOUT.NEIGHBOR_RADIUS + GRAPH_LAYOUT.CENTER_Y,
              },
              data: {
                entity: neighbor.entity,
                degree: 1,
                inDegree: neighbor.direction === 'incoming' ? 1 : 0,
                outDegree: neighbor.direction === 'outgoing' ? 1 : 0,
              },
            })
          }

          // Add edge
          const edgeId = `${neighbor.relation.sourceId}-${neighbor.relation.targetId}-${neighbor.relation.type}`
          if (!edgeMap.has(edgeId)) {
            edgeMap.set(edgeId, {
              id: edgeId,
              type: 'relation',
              source: neighbor.relation.sourceId,
              target: neighbor.relation.targetId,
              data: {
                relation: neighbor.relation,
              },
            })
          }
        })
      })

      setNodes(Array.from(nodeMap.values()))
      setEdges(Array.from(edgeMap.values()))
    } catch (err) {
      console.error('Graph fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setIsLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData])

  // Filter nodes and edges
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const entity = node.data.entity

      // Filter by entity type
      if (
        filters.entityTypes.length > 0 &&
        !filters.entityTypes.includes(entity.type)
      ) {
        return false
      }

      // Filter by search
      if (
        filters.search &&
        !entity.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      return true
    })
  }, [nodes, filters])

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id))
    return edges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )
  }, [edges, filteredNodes])

  // Handle node click
  const handleNodeClick: NodeMouseHandler<Node<EntityNodeData>> = useCallback(
    async (_event, node) => {
      try {
        const neighborhoodUrl = buildGraphApiUrl({
          action: 'neighborhood',
          entityId: node.id,
          maxDepth: String(GRAPH_LAYOUT.DEFAULT_NEIGHBORHOOD_DEPTH),
        })
        const nodeUrl = buildGraphApiUrl({
          action: 'node',
          entityId: node.id,
        })

        const [neighborhoodRes, nodeRes] = await Promise.all([
          fetch(neighborhoodUrl),
          fetch(nodeUrl),
        ])

        if (!neighborhoodRes.ok || !nodeRes.ok) {
          throw new Error('Failed to fetch node details')
        }

        const [neighborhoodData, nodeData] = await Promise.all([
          neighborhoodRes.json(),
          nodeRes.json(),
        ])

        const neighborhood: GraphNeighborhood = neighborhoodData.neighborhood
        const graphNode: GraphNode = nodeData.node

        setSelectedEntity({
          entity: neighborhood.center,
          degree: graphNode.degree,
          inDegree: graphNode.inDegree,
          outDegree: graphNode.outDegree,
          neighbors: neighborhood.neighbors,
        })
      } catch (err) {
        console.error('Failed to fetch entity details:', err)
      }
    },
    []
  )

  // Handle entity click from details panel
  const handleEntityClickFromPanel = useCallback(
    (entityId: string) => {
      const node = nodes.find((n) => n.id === entityId)
      if (!node) return

      setCenter(node.position.x, node.position.y, {
        zoom: VIEW_OPTIONS.CENTER_ZOOM,
        duration: VIEW_OPTIONS.ANIMATION_DURATION,
      })
      handleNodeClick({} as React.MouseEvent, node)
    },
    [nodes, setCenter, handleNodeClick]
  )

  // Handle fit view
  const handleFitView = useCallback(() => {
    fitView({
      padding: VIEW_OPTIONS.FIT_PADDING,
      duration: VIEW_OPTIONS.ANIMATION_DURATION,
    })
  }, [fitView])

  // Handle reset
  const handleReset = useCallback(() => {
    fetchGraphData()
    setSelectedEntity(null)
    setFilters({ entityTypes: [], search: '' })
  }, [fetchGraphData])

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchGraphData}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🕸️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No knowledge graph yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start capturing notes and CoBrain will automatically build your knowledge
            graph by extracting entities and discovering relationships.
          </p>
          <a
            href="/capture"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <span>✨</span>
            Capture your first note
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full ${className}`}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange as OnNodesChange<Node<EntityNodeData>>}
        onEdgesChange={onEdgesChange as OnEdgesChange<Edge<RelationEdgeData>>}
        onNodeClick={handleNodeClick}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodeTypes={nodeTypes as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        edgeTypes={edgeTypes as any}
        fitView
        fitViewOptions={{ padding: VIEW_OPTIONS.FIT_PADDING }}
        minZoom={VIEW_OPTIONS.MIN_ZOOM}
        maxZoom={VIEW_OPTIONS.MAX_ZOOM}
        defaultEdgeOptions={{ type: 'relation' }}
      >
        <Background color="#e5e7eb" gap={VIEW_OPTIONS.BACKGROUND_GAP} />
        <Controls
          showInteractive={false}
          className="!bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700 !shadow-lg"
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as EntityNodeData
            return ENTITY_TYPE_COLORS[data.entity.type] || DEFAULT_ENTITY_COLOR
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white dark:!bg-gray-900 !border-gray-200 dark:!border-gray-700"
        />
      </ReactFlow>

      {/* Controls */}
      <GraphControls
        stats={stats}
        filters={filters}
        onFilterChange={setFilters}
        onFitView={handleFitView}
        onReset={handleReset}
      />

      {/* Details panel */}
      {selectedEntity && (
        <div className="absolute top-0 right-0 h-full">
          <EntityDetailsPanel
            entity={selectedEntity.entity}
            degree={selectedEntity.degree}
            inDegree={selectedEntity.inDegree}
            outDegree={selectedEntity.outDegree}
            neighbors={selectedEntity.neighbors}
            onClose={() => setSelectedEntity(null)}
            onEntityClick={handleEntityClickFromPanel}
          />
        </div>
      )}
    </div>
  )
}
