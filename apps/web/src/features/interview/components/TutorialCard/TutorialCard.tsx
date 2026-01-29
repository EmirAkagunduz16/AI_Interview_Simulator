'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../../../../common/components/Button'
import './tutorial-card.styles.scss'

const TutorialCard = () => {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleNext = () => {
    router.push('/interview/instructions')
  }

  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

  return (
    <div className="tutorial-card">
      <div className="tutorial-card__video-container">
        <video
          ref={videoRef}
          className="tutorial-card__video"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          poster="/tutorial-poster.jpg"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        
        <div className="tutorial-card__controls">
          <button className="tutorial-card__play-btn" onClick={handlePlayPause}>
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          
          <span className="tutorial-card__time">
            {formatTime(currentTime)} / {formatTime(duration || 555)}
          </span>
          
          <div className="tutorial-card__progress">
            <div 
              className="tutorial-card__progress-bar" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          <div className="tutorial-card__right-controls">
            <button className="tutorial-card__control-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                <path d="M15.54,8.46a5,5,0,0,1,0,7.07" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button className="tutorial-card__control-btn">CC</button>
            <button className="tutorial-card__control-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4,15a1.65,1.65,0,0,0,.33,1.82l.06.06a2,2,0,1,1-2.83,2.83l-.06-.06a1.65,1.65,0,0,0-1.82-.33,1.65,1.65,0,0,0-1,1.51V21a2,2,0,0,1-4,0v-.09A1.65,1.65,0,0,0,9,19.4a1.65,1.65,0,0,0-1.82.33l-.06.06a2,2,0,1,1-2.83-2.83l.06-.06a1.65,1.65,0,0,0,.33-1.82,1.65,1.65,0,0,0-1.51-1H3a2,2,0,0,1,0-4h.09A1.65,1.65,0,0,0,4.6,9a1.65,1.65,0,0,0-.33-1.82l-.06-.06A2,2,0,1,1,7.05,4.29l.06.06a1.65,1.65,0,0,0,1.82.33H9a1.65,1.65,0,0,0,1-1.51V3a2,2,0,0,1,4,0v.09a1.65,1.65,0,0,0,1,1.51,1.65,1.65,0,0,0,1.82-.33l.06-.06a2,2,0,1,1,2.83,2.83l-.06.06a1.65,1.65,0,0,0-.33,1.82V9a1.65,1.65,0,0,0,1.51,1H21a2,2,0,0,1,0,4h-.09A1.65,1.65,0,0,0,19.4,15Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button className="tutorial-card__control-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="tutorial-card__action">
        <Button onClick={handleNext}>İleri</Button>
      </div>
    </div>
  )
}

export default TutorialCard
