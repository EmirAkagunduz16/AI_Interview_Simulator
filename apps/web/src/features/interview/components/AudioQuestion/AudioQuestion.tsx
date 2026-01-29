'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { nextQuestion, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import RecordingArea from '../../../../common/components/RecordingArea'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import './audio-question.styles.scss'

const AudioQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
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

  const handleRecordingClick = () => {
    setIsRecording(!isRecording)
  }

  const handleSubmit = () => {
    dispatch(setAnswer({ questionId: currentQuestion?.id ?? '', answer: 'audio_recorded' }))
    dispatch(nextQuestion())
    router.push('/interview/video')
  }

  return (
    <div className="audio-question">
      <QuestionProgressBar 
        currentQuestion={currentQuestionIndex + 1} 
        totalQuestions={questions.length} 
      />
      
      <div className="audio-question__content">
        <h1 className="audio-question__title">Sesli Soru</h1>
        <p className="audio-question__text">
          <span className="audio-question__text-link">
            {currentQuestionIndex + 1}. {currentQuestion?.text}
          </span>
        </p>
        
        <RecordingArea isRecording={isRecording} onClick={handleRecordingClick} />
      </div>
      
      <InterviewFooter 
        buttonText="Gönder ve Devam Et" 
        onButtonClick={handleSubmit}
        noteText="Not: Sayfayı yenilemeyin, aksi halde verileriniz kaybolur."
      />
    </div>
  )
}

export default AudioQuestion
