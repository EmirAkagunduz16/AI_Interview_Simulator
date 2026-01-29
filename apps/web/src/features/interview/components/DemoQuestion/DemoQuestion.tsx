'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '../../../../common/hooks/useAppDispatch'
import { completeDemo, startInterview } from '../../store/interviewSlice'
import RecordingArea from '../../../../common/components/RecordingArea'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import './demo-question.styles.scss'

const DemoQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isRecording, setIsRecording] = useState(false)

  const questionText = "1. Kendinizi kısaca tanıtır mısınız? Bu bir demo sorusudur, gerçek mülakata başlamadan önce sistemi test etmeniz için hazırlanmıştır."

  const handleRecordingClick = () => {
    setIsRecording(!isRecording)
  }

  const handleContinue = () => {
    dispatch(completeDemo())
    dispatch(startInterview())
    router.push('/interview/audio')
  }

  return (
    <div className="demo-question">
      <h1 className="demo-question__title">Demo Soru</h1>
      <p className="demo-question__text">{questionText}</p>
      
      <RecordingArea isRecording={isRecording} onClick={handleRecordingClick} />
      
      <InterviewFooter 
        buttonText="Devam Et" 
        onButtonClick={handleContinue}
        noteText="Not: Sayfayı yenilemeyin, aksi halde verileriniz kaybolur."
      />
    </div>
  )
}

export default DemoQuestion
