'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { nextQuestion, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import './video-question.styles.scss'

const VideoQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { currentQuestionIndex, questions, timeRemaining, isTimerRunning } = useAppSelector(
    (state) => state.interview
  )
  const [isRecording, setIsRecording] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch(decrementTimer())
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timeRemaining, dispatch])

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
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

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording)
  }

  const handleSubmit = () => {
    dispatch(setAnswer({ questionId: currentQuestion?.id ?? '', answer: 'video_recorded' }))
    dispatch(nextQuestion())
    router.push('/interview/mcq')
  }

  return (
    <div className="video-question">
      <QuestionProgressBar 
        currentQuestion={currentQuestionIndex + 1} 
        totalQuestions={questions.length} 
      />
      
      <div className="video-question__content">
        <h1 className="video-question__title">Video Soru</h1>
        
        <div className="video-question__layout">
          <div className="video-question__text-container">
            <p className="video-question__text">
              {currentQuestionIndex + 1}. {currentQuestion?.text}
            </p>
          </div>
          
          <div className="video-question__video-container">
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline
              className="video-question__video"
            />
            <button 
              className={`video-question__record-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleRecordingToggle}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <InterviewFooter 
        buttonText="Gönder ve Devam Et" 
        onButtonClick={handleSubmit}
        noteText="Not: Sayfayı yenilemeyin, aksi halde verileriniz kaybolur."
      />
    </div>
  )
}

export default VideoQuestion
