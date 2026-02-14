'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { nextQuestion, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import './mcq-question.styles.scss'

const McqQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { currentQuestionIndex, questions, timeRemaining, isTimerRunning } = useAppSelector(
    (state) => state.interview
  )
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

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
    if (timeRemaining === 0 && isTimerRunning) {
      handleSubmit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(o => o !== option)
      }
      return [...prev, option]
    })
  }

  const handleSubmit = () => {
    dispatch(setAnswer({ questionId: currentQuestion?.id ?? '', answer: selectedOptions }))
    dispatch(nextQuestion())
    router.push('/interview/coding')
  }

  return (
    <div className="mcq-question">
      <QuestionProgressBar 
        currentQuestion={currentQuestionIndex + 1} 
        totalQuestions={questions.length} 
      />
      
      <div className="mcq-question__content">
        <h1 className="mcq-question__title">Çoktan Seçmeli Soru</h1>
        
        <p className="mcq-question__text">
          {currentQuestionIndex + 1}. {currentQuestion?.text}
        </p>
        
        <div className="mcq-question__options">
          {currentQuestion?.options?.map((option, index) => (
            <label 
              key={index} 
              className={`mcq-question__option ${selectedOptions.includes(option) ? 'selected' : ''}`}
            >
              <input 
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={() => handleOptionToggle(option)}
                className="mcq-question__checkbox"
              />
              <span className="mcq-question__checkmark">
                {selectedOptions.includes(option) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="mcq-question__option-text">
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
      
      <InterviewFooter 
        buttonText="Gönder ve Devam Et" 
        onButtonClick={handleSubmit}
        showMediaStatus={false}
        showWebcam={false}
      />
    </div>
  )
}

export default McqQuestion
