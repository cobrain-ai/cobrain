import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { EntityNode } from './entity-node'
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_ICONS } from './types'
import type { EntityNodeData } from './types'
import type { NodeProps, Node } from '@xyflow/react'

// Wrapper component for React Flow context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

// Helper to create mock node props
function createMockNodeProps(
  overrides: Partial<NodeProps<Node<EntityNodeData, 'entity'>>> = {}
): NodeProps<Node<EntityNodeData, 'entity'>> {
  return {
    id: 'test-node-1',
    type: 'entity',
    data: {
      entity: {
        id: 'entity-1',
        name: 'Test Entity',
        type: 'person',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      degree: 5,
      inDegree: 2,
      outDegree: 3,
      isSelected: false,
      isHighlighted: false,
    },
    selected: false,
    isConnectable: true,
    positionAbsoluteX: 100,
    positionAbsoluteY: 100,
    zIndex: 0,
    dragging: false,
    ...overrides,
  }
}

describe('EntityNode', () => {
  it('renders entity name', () => {
    const props = createMockNodeProps()

    render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    expect(screen.getByText('Test Entity')).toBeInTheDocument()
  })

  it('renders correct icon for entity type', () => {
    const props = createMockNodeProps()

    render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    expect(screen.getByRole('img', { name: 'person' })).toHaveTextContent(
      ENTITY_TYPE_ICONS.person
    )
  })

  it('renders degree badge when degree > 0', () => {
    const props = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        degree: 5,
      },
    })

    render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('does not render degree badge when degree is 0', () => {
    const props = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        degree: 0,
      },
    })

    render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('applies selected styling when selected', () => {
    const props = createMockNodeProps({ selected: true })

    const { container } = render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    const nodeDiv = container.querySelector('.rounded-full.cursor-pointer')
    expect(nodeDiv?.className).toContain('ring-4')
    expect(nodeDiv?.className).toContain('ring-blue-500')
  })

  it('applies highlighted styling when highlighted', () => {
    const props = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        isHighlighted: true,
      },
    })

    const { container } = render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    const nodeDiv = container.querySelector('.rounded-full.cursor-pointer')
    expect(nodeDiv?.className).toContain('ring-2')
    expect(nodeDiv?.className).toContain('ring-yellow-400')
  })

  it('uses correct color for entity type', () => {
    const props = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        entity: {
          ...createMockNodeProps().data.entity,
          type: 'concept',
        },
      },
    })

    const { container } = render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    const nodeDiv = container.querySelector('.rounded-full.cursor-pointer') as HTMLElement
    // Browser converts hex to rgb, so check for the rgb equivalent (6, 182, 212 = #06B6D4)
    const borderStyle = nodeDiv?.style.border || ''
    expect(borderStyle.includes('6, 182, 212') || borderStyle.includes(ENTITY_TYPE_COLORS.concept)).toBe(true)
  })

  it('renders handles for connections', () => {
    const props = createMockNodeProps()

    const { container } = render(
      <TestWrapper>
        <EntityNode {...props} />
      </TestWrapper>
    )

    // React Flow handles are rendered with specific data attributes
    const handles = container.querySelectorAll('.react-flow__handle')
    expect(handles.length).toBe(2) // top and bottom handles
  })

  it('scales node size based on degree', () => {
    const lowDegreeProps = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        degree: 1,
      },
    })

    const highDegreeProps = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        degree: 10,
      },
    })

    const { container: lowContainer } = render(
      <TestWrapper>
        <EntityNode {...lowDegreeProps} />
      </TestWrapper>
    )

    const { container: highContainer } = render(
      <TestWrapper>
        <EntityNode {...highDegreeProps} />
      </TestWrapper>
    )

    const lowNode = lowContainer.querySelector('.rounded-full.cursor-pointer') as HTMLElement
    const highNode = highContainer.querySelector('.rounded-full.cursor-pointer') as HTMLElement

    // Extract width from style
    const lowWidth = parseInt(lowNode?.style.width || '0')
    const highWidth = parseInt(highNode?.style.width || '0')

    expect(highWidth).toBeGreaterThan(lowWidth)
  })

  it('caps node size at maximum', () => {
    const maxDegreeProps = createMockNodeProps({
      data: {
        ...createMockNodeProps().data,
        degree: 100, // Very high degree
      },
    })

    const { container } = render(
      <TestWrapper>
        <EntityNode {...maxDegreeProps} />
      </TestWrapper>
    )

    const node = container.querySelector('.rounded-full.cursor-pointer') as HTMLElement
    const width = parseInt(node?.style.width || '0')

    // Max size is 80
    expect(width).toBeLessThanOrEqual(80)
  })

  describe('different entity types', () => {
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
        const props = createMockNodeProps({
          data: {
            ...createMockNodeProps().data,
            entity: {
              ...createMockNodeProps().data.entity,
              type,
              name: `Test ${type}`,
            },
          },
        })

        render(
          <TestWrapper>
            <EntityNode {...props} />
          </TestWrapper>
        )

        expect(screen.getByText(`Test ${type}`)).toBeInTheDocument()
        expect(screen.getByRole('img', { name: type })).toHaveTextContent(
          ENTITY_TYPE_ICONS[type]
        )
      })
    })
  })
})
