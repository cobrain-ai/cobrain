import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { RelationEdge } from './relation-edge'
import { RELATION_TYPE_STYLES } from './types'
import type { RelationEdgeData } from './types'
import type { EdgeProps, Edge, Position } from '@xyflow/react'

// Wrapper component for React Flow context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

// Helper to create mock edge props
function createMockEdgeProps(
  overrides: Partial<EdgeProps<Edge<RelationEdgeData, 'relation'>>> = {}
): EdgeProps<Edge<RelationEdgeData, 'relation'>> {
  return {
    id: 'test-edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceX: 100,
    sourceY: 100,
    targetX: 300,
    targetY: 200,
    sourcePosition: 'bottom' as Position,
    targetPosition: 'top' as Position,
    data: {
      relation: {
        id: 'relation-1',
        sourceId: 'entity-1',
        targetId: 'entity-2',
        type: 'mentions',
        createdAt: new Date('2024-01-01'),
      },
      isHighlighted: false,
    },
    selected: false,
    sourceHandleId: null,
    targetHandleId: null,
    interactionWidth: 20,
    ...overrides,
  }
}

describe('RelationEdge', () => {
  it('renders edge path', () => {
    const props = createMockEdgeProps()

    const { container } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    // BaseEdge renders a path element
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })

  it('uses correct stroke color for relation type', () => {
    const props = createMockEdgeProps({
      data: {
        relation: {
          id: 'relation-1',
          sourceId: 'entity-1',
          targetId: 'entity-2',
          type: 'created_by',
          createdAt: new Date('2024-01-01'),
        },
        isHighlighted: false,
      },
    })

    const { container } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    const path = container.querySelector('path')
    expect(path?.getAttribute('style')).toContain(RELATION_TYPE_STYLES.created_by.stroke)
  })

  it('applies dashed style for dashed relation types', () => {
    const props = createMockEdgeProps({
      data: {
        relation: {
          id: 'relation-1',
          sourceId: 'entity-1',
          targetId: 'entity-2',
          type: 'related_to',
          createdAt: new Date('2024-01-01'),
        },
        isHighlighted: false,
      },
    })

    const { container } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    const path = container.querySelector('path')
    // Check that stroke-dasharray is applied
    expect(path?.getAttribute('style')).toContain('stroke-dasharray')
  })

  it('applies highlighted styling when highlighted', () => {
    const props = createMockEdgeProps({
      data: {
        ...createMockEdgeProps().data!,
        isHighlighted: true,
      },
    })

    const { container } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    const path = container.querySelector('path')
    // Highlighted color is #FBBF24
    expect(path?.getAttribute('style')).toContain('#FBBF24')
  })

  it('renders selected edge with thicker stroke', () => {
    // Note: EdgeLabelRenderer uses a portal that renders outside the test container
    // Testing the label presence is unreliable in jsdom, so we test the styling instead
    const props = createMockEdgeProps({
      selected: true,
      data: {
        relation: {
          id: 'relation-1',
          sourceId: 'entity-1',
          targetId: 'entity-2',
          type: 'depends_on',
          createdAt: new Date('2024-01-01'),
        },
        isHighlighted: false,
      },
    })

    const { container } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    // When selected, stroke width should be 3
    const path = container.querySelector('path.react-flow__edge-path')
    expect(path?.getAttribute('style')).toContain('stroke-width: 3')
  })

  it('does not show label when not selected', () => {
    const props = createMockEdgeProps({
      selected: false,
      data: {
        relation: {
          id: 'relation-1',
          sourceId: 'entity-1',
          targetId: 'entity-2',
          type: 'depends_on',
          createdAt: new Date('2024-01-01'),
        },
        isHighlighted: false,
      },
    })

    render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    expect(screen.queryByText('depends on')).not.toBeInTheDocument()
  })

  it('increases stroke width when selected', () => {
    const unselectedProps = createMockEdgeProps({ selected: false })
    const selectedProps = createMockEdgeProps({ selected: true })

    const { container: unselectedContainer } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...unselectedProps} />
        </svg>
      </TestWrapper>
    )

    const { container: selectedContainer } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...selectedProps} />
        </svg>
      </TestWrapper>
    )

    const unselectedPath = unselectedContainer.querySelector('path')
    const selectedPath = selectedContainer.querySelector('path')

    // Selected stroke width is 3, unselected is 1.5
    expect(selectedPath?.getAttribute('style')).toContain('stroke-width: 3')
    expect(unselectedPath?.getAttribute('style')).toContain('stroke-width: 1.5')
  })

  it('increases stroke width when highlighted', () => {
    const normalProps = createMockEdgeProps({
      data: {
        ...createMockEdgeProps().data!,
        isHighlighted: false,
      },
    })
    const highlightedProps = createMockEdgeProps({
      data: {
        ...createMockEdgeProps().data!,
        isHighlighted: true,
      },
    })

    const { container: normalContainer } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...normalProps} />
        </svg>
      </TestWrapper>
    )

    const { container: highlightedContainer } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...highlightedProps} />
        </svg>
      </TestWrapper>
    )

    const normalPath = normalContainer.querySelector('path')
    const highlightedPath = highlightedContainer.querySelector('path')

    // Highlighted stroke width is 2.5, normal is 1.5
    expect(highlightedPath?.getAttribute('style')).toContain('stroke-width: 2.5')
    expect(normalPath?.getAttribute('style')).toContain('stroke-width: 1.5')
  })

  describe('different relation types', () => {
    const relationTypes = [
      'mentions',
      'related_to',
      'part_of',
      'depends_on',
      'created_by',
      'assigned_to',
      'scheduled_for',
      'tagged_with',
      'similar_to',
      'custom',
    ] as const

    relationTypes.forEach((type) => {
      it(`renders correctly for ${type} relation type`, () => {
        const props = createMockEdgeProps({
          data: {
            relation: {
              id: 'relation-1',
              sourceId: 'entity-1',
              targetId: 'entity-2',
              type,
              createdAt: new Date('2024-01-01'),
            },
            isHighlighted: false,
          },
        })

        const { container } = render(
          <TestWrapper>
            <svg>
              <RelationEdge {...props} />
            </svg>
          </TestWrapper>
        )

        const path = container.querySelector('path')
        expect(path).toBeInTheDocument()
        expect(path?.getAttribute('style')).toContain(RELATION_TYPE_STYLES[type].stroke)
      })
    })
  })

  it('handles missing relation data gracefully', () => {
    const props = createMockEdgeProps({
      data: undefined,
    })

    const { container } = render(
      <TestWrapper>
        <svg>
          <RelationEdge {...props} />
        </svg>
      </TestWrapper>
    )

    // Should still render the edge path
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })
})
