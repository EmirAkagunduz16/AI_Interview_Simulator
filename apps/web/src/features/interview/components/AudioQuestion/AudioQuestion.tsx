'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { nextQuestion, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import { useAIInterview } from '../../../../services/ai/useAIInterview'
import './audio-question.styles.scss'

type InterviewPhase = 'initializing' | 'ai_speaking' | 'user_turn' | 'processing' | 'completed'

const MAX_CONVERSATION_ROUNDS = 3 // Number of Q&A rounds before moving to next section

const AudioQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { currentQuestionIndex, questions, timeRemaining, isTimerRunning } = useAppSelector(
    (state) => state.interview
  )
  
  const [phase, setPhase] = useState<InterviewPhase>('initializing')
  const [aiMessage, setAiMessage] = useState('')
  const [userTranscript, setUserTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, text: string}>>([])
  const [conversationRound, setConversationRound] = useState(0)
  const [allAnswers, setAllAnswers] = useState<string[]>([])
  const hasInitialized = useRef(false)
  
  const currentQuestion = questions[currentQuestionIndex]

  const {
    isLoading,
    isSpeaking,
    isListening,
    transcript,
    speakText,
    startListening,
    stopListening,
    stopSpeaking,
    processAnswerAndContinue,
    hasWebSpeechAPI,
  } = useAIInterview({
    onAIResponse: (text) => {
      setAiMessage(text)
      setConversationHistory(prev => [...prev, { role: 'ai', text }])
    },
    onUserSpeechResult: (text) => {
      setUserTranscript(prev => prev + ' ' + text)
    },
    onError: (err) => {
      // Make error messages more user-friendly
      let friendlyError = err
      if (err.includes('quota') || err.includes('exceeded')) {
        friendlyError = 'Ses servisi şimdilik kullanılamıyor. Tarayıcı sesi kullanılacak.'
      } else if (err.includes('API key')) {
        friendlyError = 'Ses servisi yapılandırılmamış. Tarayıcı sesi kullanılacak.'
      }
      setError(friendlyError)
      setPhase('user_turn')
    },
  })

  // Timer effect
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

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && isTimerRunning) {
      handleSubmit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  // Update transcript from hook
  useEffect(() => {
    if (transcript) {
      setUserTranscript(transcript)
    }
  }, [transcript])

  // Initialize - AI asks the question
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const initializeInterview = async () => {
      setPhase('ai_speaking')
      const questionText = currentQuestion?.text || 'Kendinizi kısaca tanıtır mısınız?'
      const introText = `Şimdi sana sesli bir soru soracağım. Soru şu: ${questionText}`
      setAiMessage(introText)
      setConversationHistory([{ role: 'ai', text: introText }])
      
      try {
        await speakText(introText)
        setPhase('user_turn')
      } catch {
        // If TTS fails, still allow user to answer
        setPhase('user_turn')
      }
    }

    initializeInterview()
  }, [currentQuestion?.text, speakText])

  // Update phase based on AI state
  useEffect(() => {
    if (isSpeaking) {
      setPhase('ai_speaking')
    } else if (isLoading) {
      setPhase('processing')
    } else if (isListening) {
      setPhase('user_turn')
    }
  }, [isSpeaking, isLoading, isListening])

  const handleStartRecording = useCallback(() => {
    if (hasWebSpeechAPI) {
      setUserTranscript('')
      startListening()
    } else {
      setError('Tarayıcınız ses tanıma desteklemiyor. Lütfen Chrome kullanın.')
    }
  }, [hasWebSpeechAPI, startListening])

  // Process user's answer and get AI's follow-up
  const handleSendAnswer = useCallback(async () => {
    if (!userTranscript.trim()) return

    stopListening()
    setConversationHistory(prev => [...prev, { role: 'user', text: userTranscript }])
    setAllAnswers(prev => [...prev, userTranscript])
    setPhase('processing')

    try {
      // Send to AI for evaluation and follow-up question
      await processAnswerAndContinue(userTranscript)
      setUserTranscript('')
      setConversationRound(prev => prev + 1)
      setPhase('user_turn')
    } catch {
      setError('AI yanıt veremedi. Lütfen tekrar deneyin.')
      setPhase('user_turn')
    }
  }, [userTranscript, stopListening, processAnswerAndContinue])

  const handleStopRecording = useCallback(() => {
    stopListening()
    // Don't auto-send, let user review and click send button
  }, [stopListening])

  const handleSkipAI = useCallback(() => {
    stopSpeaking()
    setPhase('user_turn')
  }, [stopSpeaking])

  const handleSubmit = () => {
    stopListening()
    stopSpeaking()
    
    // Combine all answers from the conversation
    const combinedAnswer = allAnswers.length > 0 
      ? allAnswers.join(' | ') 
      : userTranscript || 'no_response'
    
    dispatch(setAnswer({ 
      questionId: currentQuestion?.id ?? '', 
      answer: combinedAnswer
    }))
    dispatch(nextQuestion())
    router.push('/interview/video')
  }

  // Check if we should show the "Continue to Next Section" button
  const canProceedToNext = conversationRound >= MAX_CONVERSATION_ROUNDS || 
    (conversationRound > 0 && !isListening && !isSpeaking && !isLoading)

  const getPhaseMessage = () => {
    switch (phase) {
      case 'initializing':
        return 'Mülakat hazırlanıyor...'
      case 'ai_speaking':
        return 'AI konuşuyor...'
      case 'user_turn':
        return 'Cevaplamanız için mikrofona tıklayın'
      case 'processing':
        return 'Cevabınız işleniyor...'
      case 'completed':
        return 'Soru tamamlandı'
      default:
        return ''
    }
  }

  return (
    <div className="audio-question">
      <QuestionProgressBar 
        currentQuestion={currentQuestionIndex + 1} 
        totalQuestions={questions.length} 
      />
      
      <div className="audio-question__content">
        <h1 className="audio-question__title">AI Sesli Mülakat</h1>
        
        {error && (
          <div className="audio-question__error">
            {error}
            <button onClick={() => setError(null)}>Kapat</button>
          </div>
        )}
        
        {/* Phase indicator */}
        <div className="audio-question__phase">
          <span className={`audio-question__phase-dot ${phase}`} />
          <span className="audio-question__phase-text">{getPhaseMessage()}</span>
        </div>
        
        {/* AI Message Display */}
        <div className="audio-question__ai-section">
          <div className="audio-question__ai-avatar">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
            </svg>
            {isSpeaking && <span className="audio-question__speaking-indicator" />}
          </div>
          
          <div className="audio-question__ai-bubble">
            <p>{aiMessage || 'Yükleniyor...'}</p>
            {isSpeaking && (
              <button className="audio-question__skip-btn" onClick={handleSkipAI}>
                Atla
              </button>
            )}
          </div>
        </div>
        
        {/* User Response Section */}
        <div className="audio-question__user-section">
          <div className="audio-question__mic-container">
            <button
              className={`audio-question__mic-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? handleStopRecording : handleStartRecording}
              disabled={phase === 'ai_speaking' || phase === 'processing'}
            >
              {isListening ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
            <span className="audio-question__mic-label">
              {isListening ? 'Dinleniyor... (durdurmak için tıklayın)' : 'Konuşmaya başlamak için tıklayın'}
            </span>
          </div>
          
          {/* Live transcript */}
          {(userTranscript || isListening) && (
            <div className="audio-question__transcript">
              <h4>Cevabınız:</h4>
              <p>{userTranscript || (isListening ? 'Dinleniyor...' : '')}</p>
              
              {/* Send Answer Button */}
              {userTranscript && !isListening && phase === 'user_turn' && (
                <button 
                  className="audio-question__send-btn"
                  onClick={handleSendAnswer}
                  disabled={isLoading}
                >
                  {isLoading ? 'Gönderiliyor...' : 'Cevabı Gönder'}
                </button>
              )}
            </div>
          )}
          
          {/* Conversation progress indicator */}
          {conversationRound > 0 && (
            <div className="audio-question__progress">
              <span>Soru-Cevap: {conversationRound}/{MAX_CONVERSATION_ROUNDS}</span>
            </div>
          )}
        </div>
        
        {/* Conversation History */}
        {conversationHistory.length > 1 && (
          <div className="audio-question__history">
            <h4>Konuşma Geçmişi</h4>
            <div className="audio-question__history-list">
              {conversationHistory.map((item, index) => (
                <div key={index} className={`audio-question__history-item ${item.role}`}>
                  <span className="audio-question__history-role">
                    {item.role === 'ai' ? 'AI' : 'Siz'}:
                  </span>
                  <span className="audio-question__history-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <InterviewFooter 
        buttonText={canProceedToNext ? "Sonraki Bölüme Geç" : "Gönder ve Devam Et"} 
        onButtonClick={handleSubmit}
        showMediaStatus={true}
        showWebcam={false}
        disabled={!canProceedToNext && conversationRound === 0}
      />
    </div>
  )
}

export default AudioQuestion
