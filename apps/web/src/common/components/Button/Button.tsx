import React from 'react'
import './button.styles.scss'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
}

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button',
  onClick,
  className = ''
}: ButtonProps) => {
  return (
    <button 
      type={type}
      className={`btn btn--${variant} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
