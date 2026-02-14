'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { nextQuestion, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import { useAIInterview } from '../../../../services/ai/useAIInterview'
import './video-question.styles.scss'

type InterviewPhase = 'initializing' | 'ai_speaking' | 'user_turn' | 'recording' | 'processing'

const VideoQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  
  const { currentQuestionIndex, questions, timeRemaining, isTimerRunning } = useAppSelector(
    (state) => state.interview
  )
  
  const [phase, setPhase] = useState<InterviewPhase>('initializing')
  const [aiMessage, setAiMessage] = useState('')
  const [userTranscript, setUserTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, text: string}>>([])
  const hasInitialized = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentQuestion = questions[currentQuestionIndex]

  const {
    isSpeaking,
    isListening,
    transcript,
    speakText,
    startListening,
    stopListening,
    stopSpeaking,
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
      setError(err)
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

  // Initialize webcam
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'user' }, 
          audio: true 
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Webcam error:', err)
        setError('Kamera ve mikrofon erisimi reddedildi. Lutfen tarayici ayarlarindan izin verin.')
      }
    }

    startWebcam()

    return () => {
      stopRecording()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update transcript
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
      const questionText = currentQuestion?.text || 'Kendinizi tanitir misiniz?'
      const introText = `Simdi sana video ile cevaplayacagin bir soru soracagim. Kameraya bakarak ve net bir sekilde cevapla. Soru su: ${questionText}`
      setAiMessage(introText)
      setConversationHistory([{ role: 'ai', text: introText }])
      
      try {
        await speakText(introText)
        setPhase('user_turn')
      } catch {
        setPhase('user_turn')
      }
    }

    initializeInterview()
  }, [currentQuestion?.text, speakText])

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('Kamera erisimi yok.')
      return
    }

    chunksRef.current = []
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm'

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        setIsRecording(false)
        setPhase('user_turn')
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setPhase('recording')
      setRecordingDuration(0)

      // Start speech recognition too
      if (hasWebSpeechAPI) {
        setUserTranscript('')
        startListening()
      }

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('MediaRecorder error:', err)
      setError('Video kaydi baslatilamadi.')
    }
  }, [hasWebSpeechAPI, startListening])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    stopListening()
    setIsRecording(false)
    
    if (userTranscript) {
      setConversationHistory(prev => [...prev, { role: 'user', text: userTranscript }])
    }
  }, [stopListening, userTranscript])

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleSkipAI = useCallback(() => {
    stopSpeaking()
    setPhase('user_turn')
  }, [stopSpeaking])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = () => {
    stopRecording()
    stopSpeaking()
    
    dispatch(setAnswer({ 
      questionId: currentQuestion?.id ?? '', 
      answer: userTranscript || 'video_recorded' 
    }))
    dispatch(nextQuestion())
    router.push('/interview/mcq')
  }

  const getPhaseMessage = () => {
    switch (phase) {
      case 'initializing':
        return 'Mulakat hazirlaniyor...'
      case 'ai_speaking':
        return 'AI konusuyor... (dinleyin)'
      case 'user_turn':
        return 'Kayit icin butona tiklayin'
      case 'recording':
        return 'Kaydediliyor...'
      case 'processing':
        return 'Isleniyor...'
      default:
        return ''
    }
  }

  return (
    <div className="video-question">
      <QuestionProgressBar 
        currentQuestion={currentQuestionIndex + 1} 
        totalQuestions={questions.length} 
      />
      
      <div className="video-question__content">
        <h1 className="video-question__title">AI Video Mulakat</h1>
        
        {error && (
          <div className="video-question__error">
            {error}
            <button onClick={() => setError(null)}>Kapat</button>
          </div>
        )}
        
        {/* Phase indicator */}
        <div className="video-question__phase">
          <span className={`video-question__phase-dot ${phase}`} />
          <span className="video-question__phase-text">{getPhaseMessage()}</span>
        </div>
        
        <div className="video-question__layout">
          {/* AI Message Panel */}
          <div className="video-question__ai-panel">
            <div className="video-question__ai-header">
              <div className="video-question__ai-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
                </svg>
                {isSpeaking && <span className="video-question__speaking-dot" />}
              </div>
              <span>AI Mulakatci</span>
            </div>
            
            <div className="video-question__ai-message">
              <p>{aiMessage || 'Yukleniyor...'}</p>
              {isSpeaking && (
                <button className="video-question__skip-btn" onClick={handleSkipAI}>
                  Atla
                </button>
              )}
            </div>
            
            {/* Live transcript */}
            {userTranscript && (
              <div className="video-question__transcript">
                <h4>Cevabiniz (otomatik yaziya dokulmus):</h4>
                <p>{userTranscript}</p>
              </div>
            )}
          </div>
          
          {/* Video Panel */}
          <div className="video-question__video-panel">
            <div className="video-question__video-container">
              <video 
                ref={videoRef}
                autoPlay 
                muted 
                playsInline
                className="video-question__video"
              />
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="video-question__recording-indicator">
                  <span className="video-question__recording-dot" />
                  <span className="video-question__recording-time">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
              )}
              
              {/* Listening indicator */}
              {isListening && !isRecording && (
                <div className="video-question__listening-indicator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                  <span>Dinleniyor</span>
                </div>
              )}
              
              {/* Record button */}
              <button 
                className={`video-question__record-btn ${isRecording ? 'recording' : ''}`}
                onClick={handleRecordingToggle}
                disabled={phase === 'ai_speaking'}
                title={isRecording ? 'Kaydi Durdur' : 'Kayda Basla'}
              >
                {isRecording ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Conversation History */}
        {conversationHistory.length > 1 && (
          <div className="video-question__history">
            <h4>Konusma Gecmisi</h4>
            <div className="video-question__history-list">
              {conversationHistory.map((item, index) => (
                <div key={index} className={`video-question__history-item ${item.role}`}>
                  <span className="video-question__history-role">
                    {item.role === 'ai' ? 'AI' : 'Siz'}:
                  </span>
                  <span className="video-question__history-text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <InterviewFooter 
        buttonText="Gonder ve Devam Et" 
        onButtonClick={handleSubmit}
        showMediaStatus={true}
        showWebcam={false}
      />
    </div>
  )
}

export default VideoQuestion
