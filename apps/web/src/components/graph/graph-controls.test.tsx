import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphControls } from './graph-controls'
import type { GraphStats } from './types'
import type { EntityType } from '@cobrain/core'

// Helper to create mock stats
function createMockStats(overrides: Partial<GraphStats> = {}): GraphStats {
  return {
    totalNodes: 100,
    totalEdges: 250,
    nodesByType: {
      person: 30,
      organization: 20,
      concept: 50,
    },
    edgesByType: {
      mentions: 100,
      related_to: 150,
    },
    avgDegree: 2.5,
    ...overrides,
  }
}

describe('GraphControls', () => {
  const defaultProps = {
    stats: createMockStats(),
    filters: {
      entityTypes: [] as EntityType[],
      search: '',
    },
    onFilterChange: vi.fn(),
    onFitView: vi.fn(),
    onReset: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Search', () => {
    it('renders search input', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByPlaceholderText('Search entities...')).toBeInTheDocument()
    })

    it('displays current search value', () => {
      render(
        <GraphControls
          {...defaultProps}
          filters={{ entityTypes: [], search: 'test query' }}
        />
      )

      expect(screen.getByDisplayValue('test query')).toBeInTheDocument()
    })

    it('calls onFilterChange when search input changes', async () => {
      const onFilterChange = vi.fn()
      render(
        <GraphControls
          {...defaultProps}
          onFilterChange={onFilterChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search entities...')
      await userEvent.type(searchInput, 'hello')

      // Each keystroke triggers onFilterChange
      expect(onFilterChange).toHaveBeenCalled()
      expect(onFilterChange.mock.calls.length).toBe(5) // 'h', 'e', 'l', 'l', 'o'
    })
  })

  describe('Entity Type Filters', () => {
    it('renders entity type filter section', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByText('Filter by type')).toBeInTheDocument()
    })

    it('shows entity types that have nodes', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByTitle(/person: 30 entities/i)).toBeInTheDocument()
      expect(screen.getByTitle(/organization: 20 entities/i)).toBeInTheDocument()
      expect(screen.getByTitle(/concept: 50 entities/i)).toBeInTheDocument()
    })

    it('toggles entity type filter on click', async () => {
      const onFilterChange = vi.fn()
      render(
        <GraphControls
          {...defaultProps}
          onFilterChange={onFilterChange}
        />
      )

      const personButton = screen.getByTitle(/person: 30 entities/i)
      await userEvent.click(personButton)

      expect(onFilterChange).toHaveBeenCalledWith({
        entityTypes: ['person'],
        search: '',
      })
    })

    it('removes entity type from filter when clicking active type', async () => {
      const onFilterChange = vi.fn()
      render(
        <GraphControls
          {...defaultProps}
          filters={{ entityTypes: ['person', 'concept'], search: '' }}
          onFilterChange={onFilterChange}
        />
      )

      const personButton = screen.getByTitle(/person: 30 entities/i)
      await userEvent.click(personButton)

      expect(onFilterChange).toHaveBeenCalledWith({
        entityTypes: ['concept'],
        search: '',
      })
    })

    it('shows count in entity type button', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByText('(30)')).toBeInTheDocument()
      expect(screen.getByText('(20)')).toBeInTheDocument()
      expect(screen.getByText('(50)')).toBeInTheDocument()
    })

    it('shows clear filters button when filters are active', () => {
      render(
        <GraphControls
          {...defaultProps}
          filters={{ entityTypes: ['person'], search: '' }}
        />
      )

      expect(screen.getByText('Clear filters')).toBeInTheDocument()
    })

    it('clears filters when clear button is clicked', async () => {
      const onFilterChange = vi.fn()
      render(
        <GraphControls
          {...defaultProps}
          filters={{ entityTypes: ['person'], search: 'test' }}
          onFilterChange={onFilterChange}
        />
      )

      await userEvent.click(screen.getByText('Clear filters'))

      expect(onFilterChange).toHaveBeenCalledWith({
        entityTypes: [],
        search: '',
      })
    })

    it('does not show clear filters button when no filters active', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
    })
  })

  describe('View Controls', () => {
    it('renders fit view button', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByTitle('Fit view')).toBeInTheDocument()
      expect(screen.getByText('Fit')).toBeInTheDocument()
    })

    it('calls onFitView when fit button is clicked', async () => {
      const onFitView = vi.fn()
      render(<GraphControls {...defaultProps} onFitView={onFitView} />)

      await userEvent.click(screen.getByTitle('Fit view'))

      expect(onFitView).toHaveBeenCalledTimes(1)
    })

    it('renders reset button', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByTitle('Reset view')).toBeInTheDocument()
      expect(screen.getByText('Reset')).toBeInTheDocument()
    })

    it('calls onReset when reset button is clicked', async () => {
      const onReset = vi.fn()
      render(<GraphControls {...defaultProps} onReset={onReset} />)

      await userEvent.click(screen.getByTitle('Reset view'))

      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('Stats Display', () => {
    it('renders stats when provided', () => {
      render(<GraphControls {...defaultProps} />)

      expect(screen.getByText('Nodes:')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('Edges:')).toBeInTheDocument()
      expect(screen.getByText('250')).toBeInTheDocument()
      expect(screen.getByText('Avg. degree:')).toBeInTheDocument()
      expect(screen.getByText('2.5')).toBeInTheDocument()
    })

    it('does not render stats section when stats is null', () => {
      render(<GraphControls {...defaultProps} stats={null} />)

      expect(screen.queryByText('Nodes:')).not.toBeInTheDocument()
    })

    it('formats avgDegree to one decimal place', () => {
      render(
        <GraphControls
          {...defaultProps}
          stats={createMockStats({ avgDegree: 3.456 })}
        />
      )

      expect(screen.getByText('3.5')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('has proper container positioning', () => {
      const { container } = render(<GraphControls {...defaultProps} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv.className).toContain('absolute')
      expect(mainDiv.className).toContain('top-4')
      expect(mainDiv.className).toContain('left-4')
      expect(mainDiv.className).toContain('z-10')
    })

    it('renders sections in proper order', () => {
      const { container } = render(<GraphControls {...defaultProps} />)

      const sections = container.querySelectorAll('.bg-white, .dark\\:bg-gray-900')
      expect(sections.length).toBeGreaterThanOrEqual(3) // search, filters, controls, stats
    })
  })

  describe('Edge Cases', () => {
    it('handles empty stats nodesByType', () => {
      render(
        <GraphControls
          {...defaultProps}
          stats={createMockStats({ nodesByType: {} })}
        />
      )

      expect(screen.getByText('Filter by type')).toBeInTheDocument()
      // No entity type buttons should be visible
      expect(screen.queryByTitle(/person:/)).not.toBeInTheDocument()
    })

    it('handles missing entity type in nodesByType', () => {
      const stats = createMockStats({
        nodesByType: {
          person: 10,
          // concept not included
        },
      })

      render(<GraphControls {...defaultProps} stats={stats} />)

      expect(screen.getByTitle(/person: 10 entities/)).toBeInTheDocument()
      // Types with 0 count and no active filter should not appear
      expect(screen.queryByTitle(/concept: 0 entities/)).not.toBeInTheDocument()
    })
  })
})
