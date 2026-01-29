'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { completeInterview, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import './coding-question.styles.scss'

const CodingQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { currentQuestionIndex, questions, timeRemaining, isTimerRunning } = useAppSelector(
    (state) => state.interview
  )
  
  const currentQuestion = questions[currentQuestionIndex]
  const [code, setCode] = useState(currentQuestion?.code ?? '')

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

  const handleSaveCode = () => {
    dispatch(setAnswer({ questionId: currentQuestion?.id ?? '', answer: code }))
  }

  const handleRunCode = () => {
    console.log('Running code:', code)
  }

  const handleFullScreen = () => {
    const codeEditor = document.querySelector('.coding-question__editor')
    if (codeEditor) {
      codeEditor.requestFullscreen?.()
    }
  }

  const handleSubmit = () => {
    dispatch(setAnswer({ questionId: currentQuestion?.id ?? '', answer: code }))
    dispatch(completeInterview())
    router.push('/interview/result')
  }

  const renderCodeWithLineNumbers = () => {
    const lines = code.split('\n')
    return lines.map((line, index) => (
      <div key={index} className="coding-question__line">
        <span className="coding-question__line-number">{index + 1}</span>
        <pre className="coding-question__line-content">{highlightSyntax(line)}</pre>
      </div>
    ))
  }

  const highlightSyntax = (line: string) => {
    return line
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
      .replace(/\b(class|extends|return|const|let|var|function|if|else)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(React|Component|ReactDOM)\b/g, '<span class="class-name">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/(&lt;[^&]*&gt;)/g, '<span class="tag">$1</span>')
  }

  return (
    <div className="coding-question">
      <QuestionProgressBar 
        currentQuestion={currentQuestionIndex + 1} 
        totalQuestions={questions.length} 
      />
      
      <div className="coding-question__content">
        <h1 className="coding-question__title">Kodlama Sorusu</h1>
        
        <div className="coding-question__layout">
          <div className="coding-question__text-container">
            <p className="coding-question__text">
              {currentQuestionIndex + 1}. {currentQuestion?.text}
            </p>
          </div>
          
          <div className="coding-question__editor-container">
            <div className="coding-question__editor">
              <div className="coding-question__code-display">
                {renderCodeWithLineNumbers()}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="coding-question__textarea"
                spellCheck={false}
              />
            </div>
            
            <div className="coding-question__actions">
              <button className="coding-question__btn coding-question__btn--save" onClick={handleSaveCode}>
                Kodu Kaydet
              </button>
              <button className="coding-question__btn coding-question__btn--run" onClick={handleRunCode}>
                Kodu Çalıştır
              </button>
              <button className="coding-question__btn coding-question__btn--fullscreen" onClick={handleFullScreen}>
                Tam Ekran
              </button>
            </div>
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

export default CodingQuestion
