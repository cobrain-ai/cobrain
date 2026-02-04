import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntityDetailsPanel } from './entity-details-panel'
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_ICONS } from './types'
import type { Entity, EntityRelation } from '@cobrain/core'

// Helper to create mock entity
function createMockEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'entity-1',
    name: 'Test Entity',
    type: 'person',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  }
}

// Helper to create mock relation
function createMockRelation(overrides: Partial<EntityRelation> = {}): EntityRelation {
  return {
    id: 'relation-1',
    sourceId: 'entity-1',
    targetId: 'entity-2',
    type: 'mentions',
    createdAt: new Date('2024-01-15'),
    ...overrides,
  }
}

// Helper to create mock neighbor
function createMockNeighbor(
  entityOverrides: Partial<Entity> = {},
  direction: 'incoming' | 'outgoing' = 'outgoing'
) {
  return {
    entity: createMockEntity({ id: 'neighbor-1', name: 'Neighbor Entity', ...entityOverrides }),
    relation: createMockRelation(),
    direction,
  }
}

describe('EntityDetailsPanel', () => {
  const defaultProps = {
    entity: createMockEntity(),
    degree: 5,
    inDegree: 2,
    outDegree: 3,
    neighbors: [],
    onClose: vi.fn(),
    onEntityClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Header', () => {
    it('renders entity name', () => {
      render(<EntityDetailsPanel {...defaultProps} />)

      expect(screen.getByText('Test Entity')).toBeInTheDocument()
    })

    it('renders entity type badge', () => {
      render(<EntityDetailsPanel {...defaultProps} />)

      expect(screen.getByText('person')).toBeInTheDocument()
    })

    it('renders correct icon for entity type', () => {
      render(<EntityDetailsPanel {...defaultProps} />)

      // Find the icon container
      const iconContainer = screen.getByText(ENTITY_TYPE_ICONS.person)
      expect(iconContainer).toBeInTheDocument()
    })

    it('applies correct color for entity type', () => {
      const { container } = render(<EntityDetailsPanel {...defaultProps} />)

      const coloredElements = container.querySelectorAll('[style]')
      const hasCorrectColor = Array.from(coloredElements).some((el) => {
        const style = (el as HTMLElement).getAttribute('style') || ''
        // Check for the color in both hex format and rgb format (59, 130, 246 = #3B82F6)
        return style.includes(ENTITY_TYPE_COLORS.person) || style.includes('59, 130, 246')
      })
      expect(hasCorrectColor).toBe(true)
    })

    it('renders close button', () => {
      render(<EntityDetailsPanel {...defaultProps} />)

      expect(screen.getByLabelText('Close panel')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      render(<EntityDetailsPanel {...defaultProps} onClose={onClose} />)

      await userEvent.click(screen.getByLabelText('Close panel'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Connection Stats', () => {
    it('renders total degree', () => {
      render(<EntityDetailsPanel {...defaultProps} degree={10} />)

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('renders incoming degree', () => {
      render(<EntityDetailsPanel {...defaultProps} inDegree={4} />)

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('Incoming')).toBeInTheDocument()
    })

    it('renders outgoing degree', () => {
      render(<EntityDetailsPanel {...defaultProps} outDegree={6} />)

      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('Outgoing')).toBeInTheDocument()
    })

    it('renders connections header', () => {
      render(<EntityDetailsPanel {...defaultProps} />)

      expect(screen.getByText('Connections')).toBeInTheDocument()
    })
  })

  describe('Neighbors List', () => {
    it('shows empty state when no neighbors', () => {
      render(<EntityDetailsPanel {...defaultProps} neighbors={[]} />)

      expect(screen.getByText('No connections found')).toBeInTheDocument()
    })

    it('renders neighbor count in header', () => {
      const neighbors = [
        createMockNeighbor({ id: 'n1', name: 'Neighbor 1' }),
        createMockNeighbor({ id: 'n2', name: 'Neighbor 2' }),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText('Connected Entities (2)')).toBeInTheDocument()
    })

    it('renders neighbor entities', () => {
      const neighbors = [
        createMockNeighbor({ name: 'John Doe' }),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('shows correct direction indicator for outgoing', () => {
      const neighbors = [
        createMockNeighbor({ name: 'Outgoing Neighbor' }, 'outgoing'),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText('→')).toBeInTheDocument()
    })

    it('shows correct direction indicator for incoming', () => {
      const neighbors = [
        createMockNeighbor({ name: 'Incoming Neighbor' }, 'incoming'),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText('←')).toBeInTheDocument()
    })

    it('shows relation type', () => {
      const neighbors = [
        {
          entity: createMockEntity({ id: 'n1', name: 'Neighbor' }),
          relation: createMockRelation({ type: 'depends_on' }),
          direction: 'outgoing' as const,
        },
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      // Type should be displayed with underscore replaced by space
      expect(screen.getByText('depends on')).toBeInTheDocument()
    })

    it('calls onEntityClick when neighbor is clicked', async () => {
      const onEntityClick = vi.fn()
      const neighbors = [
        createMockNeighbor({ id: 'neighbor-123', name: 'Clickable Neighbor' }),
      ]

      render(
        <EntityDetailsPanel
          {...defaultProps}
          neighbors={neighbors}
          onEntityClick={onEntityClick}
        />
      )

      await userEvent.click(screen.getByText('Clickable Neighbor'))

      expect(onEntityClick).toHaveBeenCalledWith('neighbor-123')
    })

    it('renders correct icon for neighbor entity type', () => {
      const neighbors = [
        createMockNeighbor({ type: 'organization', name: 'Org Neighbor' }),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText(ENTITY_TYPE_ICONS.organization)).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('displays creation date', () => {
      render(
        <EntityDetailsPanel
          {...defaultProps}
          entity={createMockEntity({ createdAt: new Date('2024-06-15') })}
        />
      )

      expect(screen.getByText(/Created Jun 15, 2024/)).toBeInTheDocument()
    })

    it('formats date correctly', () => {
      render(
        <EntityDetailsPanel
          {...defaultProps}
          entity={createMockEntity({ createdAt: new Date('2023-12-25') })}
        />
      )

      expect(screen.getByText(/Created Dec 25, 2023/)).toBeInTheDocument()
    })
  })

  describe('Different Entity Types', () => {
    const entityTypes = [
      'person',
      'organization',
      'place',
      'project',
      'task',
      'concept',
      'event',
      'tag',
    ] as const

    entityTypes.forEach((type) => {
      it(`renders correctly for ${type} entity type`, () => {
        render(
          <EntityDetailsPanel
            {...defaultProps}
            entity={createMockEntity({ type, name: `Test ${type}` })}
          />
        )

        expect(screen.getByText(`Test ${type}`)).toBeInTheDocument()
        expect(screen.getByText(type)).toBeInTheDocument()
        expect(screen.getByText(ENTITY_TYPE_ICONS[type])).toBeInTheDocument()
      })
    })
  })

  describe('Styling', () => {
    it('has correct panel width', () => {
      const { container } = render(<EntityDetailsPanel {...defaultProps} />)

      const panel = container.firstChild as HTMLElement
      expect(panel.className).toContain('w-80')
    })

    it('has proper height styling', () => {
      const { container } = render(<EntityDetailsPanel {...defaultProps} />)

      const panel = container.firstChild as HTMLElement
      expect(panel.className).toContain('h-full')
    })

    it('has border styling', () => {
      const { container } = render(<EntityDetailsPanel {...defaultProps} />)

      const panel = container.firstChild as HTMLElement
      expect(panel.className).toContain('border-l')
    })
  })

  describe('Multiple Neighbors', () => {
    it('renders all neighbors', () => {
      const neighbors = [
        createMockNeighbor({ id: 'n1', name: 'Neighbor One' }),
        createMockNeighbor({ id: 'n2', name: 'Neighbor Two' }),
        createMockNeighbor({ id: 'n3', name: 'Neighbor Three' }),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText('Neighbor One')).toBeInTheDocument()
      expect(screen.getByText('Neighbor Two')).toBeInTheDocument()
      expect(screen.getByText('Neighbor Three')).toBeInTheDocument()
    })

    it('handles mixed direction neighbors', () => {
      const neighbors = [
        createMockNeighbor({ id: 'n1', name: 'Outgoing' }, 'outgoing'),
        createMockNeighbor({ id: 'n2', name: 'Incoming' }, 'incoming'),
      ]

      render(<EntityDetailsPanel {...defaultProps} neighbors={neighbors} />)

      expect(screen.getByText('→')).toBeInTheDocument()
      expect(screen.getByText('←')).toBeInTheDocument()
    })
  })
})
