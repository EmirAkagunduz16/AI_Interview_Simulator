import React from 'react'
import './media-status-indicator.styles.scss'

interface MediaStatusIndicatorProps {
  micActive?: boolean
  screenShareActive?: boolean
}

const MediaStatusIndicator = ({ 
  micActive = true, 
  screenShareActive = true 
}: MediaStatusIndicatorProps) => {
  return (
    <div className="media-status">
      <div className="media-status__item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <div className="media-status__bars">
          <span className={`media-status__bar ${micActive ? 'active' : ''}`} />
          <span className={`media-status__bar ${micActive ? 'active' : ''}`} />
          <span className={`media-status__bar ${micActive ? 'active' : ''}`} />
        </div>
      </div>
      
      <div className="media-status__item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <div className="media-status__bars">
          <span className={`media-status__bar ${screenShareActive ? 'active' : ''}`} />
          <span className={`media-status__bar ${screenShareActive ? 'active' : ''}`} />
          <span className={`media-status__bar ${screenShareActive ? 'active' : ''}`} />
        </div>
      </div>
    </div>
  )
}

export default MediaStatusIndicator
