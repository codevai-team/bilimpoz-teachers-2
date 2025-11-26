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
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-[var(--bg-active-button)] text-[var(--text-active-button)] hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] border-2 border-[var(--border-primary)] shadow-lg hover:shadow-xl focus:opacity-85',
    secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:scale-[1.02] active:scale-[0.98] border border-[var(--border-primary)] shadow-md hover:shadow-lg focus:bg-[var(--bg-hover)]',
    outline: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] focus:bg-[var(--bg-hover)]',
    danger: 'bg-[var(--accent-danger)] text-white hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] border border-[var(--accent-danger)] shadow-lg hover:shadow-xl focus:opacity-85',
    warning: 'bg-[var(--accent-warning)] text-white hover:bg-yellow-700 hover:scale-[1.02] active:scale-[0.98] border border-[var(--accent-warning)] shadow-lg hover:shadow-xl focus:opacity-85'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2 text-base rounded-lg',
    lg: 'px-8 py-3 text-lg rounded-xl'
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






