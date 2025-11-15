'use client'

import React from 'react'
import { Icons } from './Icons'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-white text-black hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] border border-white shadow-lg hover:shadow-xl focus:ring-white/30',
    secondary: 'bg-[#242424] text-white hover:bg-[#2a2a2a] hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50 shadow-md hover:shadow-lg focus:ring-white/20',
    outline: 'bg-transparent text-white hover:bg-white hover:text-black border border-white focus:ring-white/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] border border-red-600 shadow-lg hover:shadow-xl focus:ring-red-500/30',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 hover:scale-[1.02] active:scale-[0.98] border border-yellow-600 shadow-lg hover:shadow-xl focus:ring-yellow-500/30'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-8 py-3 text-lg'
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  
  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Загрузка...
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button






