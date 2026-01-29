'use client'

import React, { useEffect, useRef } from 'react'
import './webcam-preview.styles.scss'

const WebcamPreview = () => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.log('Webcam access denied or not available')
      }
    }

    startWebcam()

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="webcam-preview">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        className="webcam-preview__video"
      />
      <div className="webcam-preview__placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  )
}

export default WebcamPreview
