'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input: React.FC<InputProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  return (
    <input
      className={`
        w-full px-5 py-4 rounded-xl border
        text-white placeholder-gray-400
        focus:outline-none
        transition-all duration-300 ease-in-out
        ${error 
          ? 'border-red-400 focus:border-red-400' 
          : 'border-gray-600 hover:border-gray-500 focus:border-white'
        }
        ${className}
      `}
      style={{ backgroundColor: '#0b0b0b' }}
      {...props}
    />
  )
}

export default Input






