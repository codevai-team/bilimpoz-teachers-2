'use client'

import React from 'react'

interface TestRACBlockProps {
  blockId: string
  data?: any
  onUpdate?: (updates: any) => void
  onRemove?: () => void
  disabled?: boolean
}

const TestRACBlock: React.FC<TestRACBlockProps> = ({
  blockId,
  data,
  onUpdate,
  onRemove,
  disabled
}) => {
  return (
    <div className="p-4 border border-gray-600 rounded-lg">
      <p className="text-gray-400">TestRACBlock component - to be implemented</p>
    </div>
  )
}

export default TestRACBlock

