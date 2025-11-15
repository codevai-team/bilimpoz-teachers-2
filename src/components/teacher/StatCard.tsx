'use client'

import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  onClick,
  className = ''
}) => {
  const isClickable = !!onClick

  return (
    <div
      className={`bg-[#1A1A1A] rounded-2xl p-6 transition-all ${
        isClickable 
          ? 'hover:bg-[#1f1f1f] cursor-pointer group' 
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Иконка и заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-[#242424] rounded-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      {/* Заголовок */}
      <h3 className="text-sm font-medium text-gray-400 mb-1">
        {title}
      </h3>
      
      {/* Значение */}
      <p className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

export default StatCard
