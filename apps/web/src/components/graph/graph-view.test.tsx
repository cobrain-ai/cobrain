import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { GraphView } from './graph-view'
import type { GraphStats, GraphNode, GraphNeighborhood } from './types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Wrapper component for React Flow context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

// Mock response data
const mockStats: GraphStats = {
  totalNodes: 10,
  totalEdges: 15,
  nodesByType: {
    person: 5,
    concept: 5,
  },
  edgesByType: {
    mentions: 10,
    related_to: 5,
  },
  avgDegree: 1.5,
}

const mockHubs: GraphNode[] = [
  {
    entity: {
      id: 'hub-1',
      name: 'Hub Entity 1',
      type: 'person',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    degree: 5,
    inDegree: 2,
    outDegree: 3,
  },
  {
    entity: {
      id: 'hub-2',
      name: 'Hub Entity 2',
      type: 'concept',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    degree: 3,
    inDegree: 1,
    outDegree: 2,
  },
]

const mockNeighborhood: GraphNeighborhood = {
  center: mockHubs[0].entity,
  neighbors: [
    {
      entity: {
        id: 'neighbor-1',
        name: 'Neighbor 1',
        type: 'concept',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      relation: {
        id: 'rel-1',
        sourceId: 'hub-1',
        targetId: 'neighbor-1',
        type: 'mentions',
        createdAt: new Date('2024-01-01'),
      },
      direction: 'outgoing',
    },
  ],
}

describe('GraphView', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      expect(screen.getByText('Loading knowledge graph...')).toBeInTheDocument()
    })

    it('shows loading spinner', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { container } = render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('retries fetch when retry button is clicked', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error')) // Second parallel call also fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: mockHubs }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ neighborhood: mockNeighborhood }),
        })

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Retry'))

      // Initial fetches stats + hubs in parallel (2 calls), then retry also fetches both (2 more)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(4)
    })

    it('shows generic error for non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('Unknown error')

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load graph')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no hubs returned', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: [] }),
        })

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No knowledge graph yet')).toBeInTheDocument()
      })
    })

    it('shows capture note CTA in empty state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: [] }),
        })

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Capture your first note')).toBeInTheDocument()
      })
    })

    it('links to capture page in empty state', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: [] }),
        })

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /capture your first note/i })
        expect(link).toHaveAttribute('href', '/capture')
      })
    })
  })

  describe('Graph Rendering', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: mockHubs }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ neighborhood: mockNeighborhood }),
        })
    })

    it('renders graph after loading', async () => {
      const { container } = render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(container.querySelector('.react-flow')).toBeInTheDocument()
      })
    })

    it('renders graph controls', async () => {
      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search entities...')).toBeInTheDocument()
      })
    })

    it('renders graph stats in controls', async () => {
      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Nodes:')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })

    it('fetches stats and hubs on mount', async () => {
      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/graph?action=stats')
        expect(mockFetch).toHaveBeenCalledWith('/api/graph?action=hubs&limit=50')
      })
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: mockHubs }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ neighborhood: mockNeighborhood }),
        })
    })

    it('shows filter controls', async () => {
      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Filter by type')).toBeInTheDocument()
      })
    })

    it('shows fit view button', async () => {
      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Fit')).toBeInTheDocument()
      })
    })

    it('shows reset button', async () => {
      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument()
      })
    })
  })

  describe('API Error Handling', () => {
    it('handles non-ok stats response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: mockHubs }),
        })

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch graph data')).toBeInTheDocument()
      })
    })

    it('handles non-ok hubs response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })

      render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch graph data')).toBeInTheDocument()
      })
    })
  })

  describe('Styling', () => {
    it('accepts className prop', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: [] }),
        })

      const { container } = render(
        <TestWrapper>
          <GraphView className="custom-class" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(container.firstChild).toHaveClass('custom-class')
      })
    })

    it('renders with relative positioning for panels', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hubs: mockHubs }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ neighborhood: mockNeighborhood }),
        })

      const { container } = render(
        <TestWrapper>
          <GraphView />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(container.querySelector('.relative')).toBeInTheDocument()
      })
    })
  })
})
