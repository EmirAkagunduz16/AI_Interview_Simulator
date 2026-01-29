import React from 'react'
import './card.styles.scss'

interface CardProps {
  title: string
  children: React.ReactNode
  className?: string
}

const Card = ({ title, children, className = '' }: CardProps) => {
  return (
    <div className={`card ${className}`}>
      <h2 className='card__title'>{title}</h2>
      {children}
    </div>
  )
}

export default Card
