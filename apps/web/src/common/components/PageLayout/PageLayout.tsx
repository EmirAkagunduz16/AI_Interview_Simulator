import React from 'react'
import './page-layout.styles.scss'

interface PageLayoutProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  emoji?: string
}

const PageLayout = ({ title, subtitle, children, emoji }: PageLayoutProps) => {
  return (
    <main className='page-layout'>
      <div className='page-layout__content'>
        {title && (
          <h1 className='page-layout__title'>
            {title} {emoji && <span className='page-layout__emoji'>{emoji}</span>}
          </h1>
        )}
        {subtitle && <p className='page-layout__subtitle'>{subtitle}</p>}
        
        {children}
      </div>
      
      <div className='page-layout__decoration'>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M 0 200 Q 50 150 100 180 Q 150 210 200 160 L 200 200 Z" 
            fill="rgba(0, 191, 165, 0.15)"
          />
          <path 
            d="M 0 200 Q 40 170 80 190 Q 120 210 160 180 Q 180 165 200 175 L 200 200 Z" 
            fill="rgba(0, 191, 165, 0.25)"
          />
        </svg>
      </div>
    </main>
  )
}

export default PageLayout
