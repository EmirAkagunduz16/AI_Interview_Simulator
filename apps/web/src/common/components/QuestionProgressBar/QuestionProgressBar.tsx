'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import './question-progress-bar.styles.scss'

interface QuestionProgressBarProps {
  currentQuestion: number
  totalQuestions: number
  onBack?: () => void
}

const QuestionProgressBar = ({ 
  currentQuestion, 
  totalQuestions,
  onBack
}: QuestionProgressBarProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="question-progress">
      <button className="question-progress__back" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Geri
      </button>
      
      <div className="question-progress__bars">
        {Array.from({ length: totalQuestions }).map((_, index) => (
          <div 
            key={index}
            className={`question-progress__bar ${index < currentQuestion ? 'completed' : ''} ${index === currentQuestion - 1 ? 'current' : ''}`}
          />
        ))}
      </div>
      
      <span className="question-progress__count">
        ({currentQuestion.toString().padStart(2, '0')}/{totalQuestions.toString().padStart(2, '0')})
      </span>
    </div>
  )
}

export default QuestionProgressBar
