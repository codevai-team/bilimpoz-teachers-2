'use client'

import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, fullWidth = true, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          ${fullWidth ? 'w-full' : ''}
          px-5 py-4 rounded-xl text-[var(--text-primary)] placeholder-gray-400
          bg-[var(--bg-input)] border transition-all duration-300 ease-in-out
          focus:outline-none focus:border-[var(--text-primary)]
          hover:border-gray-500
          ${error ? 'border-red-500 focus:border-red-400' : 'border-gray-600'}
          ${className}
        `}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input