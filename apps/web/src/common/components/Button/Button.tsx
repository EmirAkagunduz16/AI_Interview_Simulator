import React from 'react'
import './button.styles.scss'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
  disabled?: boolean
}

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button',
  onClick,
  className = '',
  disabled = false
}: ButtonProps) => {
  return (
    <button 
      type={type}
      className={`btn btn--${variant} ${className} ${disabled ? 'btn--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button
