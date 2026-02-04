'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { GraphView } from '@/components/graph'

export default function GraphPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ReactFlowProvider>
        <GraphView className="w-full h-full" />
      </ReactFlowProvider>
    </div>
  )
}
