'use client'

import React from 'react'
import './recording-area.styles.scss'

interface RecordingAreaProps {
  isRecording?: boolean
  onClick?: () => void
}

const RecordingArea = ({ isRecording = false, onClick }: RecordingAreaProps) => {
  return (
    <div className={`recording-area ${isRecording ? 'recording-area--active' : ''}`} onClick={onClick}>
      <button className="recording-area__btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
          <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </div>
  )
}

export default RecordingArea
