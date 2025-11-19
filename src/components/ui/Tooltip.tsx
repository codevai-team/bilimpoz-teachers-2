'use client'

import React, { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  text: string
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const spaceAbove = triggerRect.top
      const spaceBelow = window.innerHeight - triggerRect.bottom

      if (spaceBelow < tooltipRect.height && spaceAbove > spaceBelow) {
        setPosition('top')
      } else {
        setPosition('bottom')
      }
    }
  }, [isVisible])

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-[9999] px-3 py-2 rounded-lg
            bg-[var(--bg-card)] border border-[var(--border-primary)]
            shadow-xl
            text-[var(--text-primary)] text-xs whitespace-nowrap
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 transform -translate-x-1/2
          `}
        >
          {text}
          {/* Треугольный указатель */}
          <div
            className={`
              absolute left-1/2 transform -translate-x-1/2
              w-0 h-0 border-4 border-transparent
              ${position === 'top' 
                ? 'top-full' 
                : 'bottom-full'
              }
            `}
            style={{
              borderTopColor: position === 'top' ? 'var(--bg-card)' : 'transparent',
              borderBottomColor: position === 'bottom' ? 'var(--bg-card)' : 'transparent',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Tooltip






