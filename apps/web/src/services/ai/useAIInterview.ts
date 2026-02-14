'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AI_CONFIG } from './config'

// Web Speech API type definitions
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UseAIInterviewOptions {
  onAIResponse?: (text: string) => void
  onAIAudioReady?: (audioUrl: string) => void
  onUserSpeechResult?: (text: string) => void
  onError?: (error: string) => void
}

export function useAIInterview(options: UseAIInterviewOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass() as ISpeechRecognition
        
        recognition.lang = AI_CONFIG.speech.language
        recognition.continuous = AI_CONFIG.speech.continuous
        recognition.interimResults = AI_CONFIG.speech.interimResults

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (!result) continue
            
            const alternative = result[0]
            if (!alternative) continue
            
            if (result.isFinal) {
              finalTranscript += alternative.transcript
            } else {
              interimTranscript += alternative.transcript
            }
          }

          setTranscript(finalTranscript || interimTranscript)
          
          if (finalTranscript) {
            options.onUserSpeechResult?.(finalTranscript)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          // Ignore common non-critical errors
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            options.onError?.(`Konuşma tanıma hatası: ${event.error}`)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      recognitionRef.current?.stop()
    }
  }, [options])

  // Send message to AI
  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage }
    ]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: AI_CONFIG.interview.systemPrompt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AI yanit hatasi')
      }

      const assistantMessage = data.message
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
      options.onAIResponse?.(assistantMessage)

      return assistantMessage

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
      options.onError?.(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [messages, options])

  // Browser TTS fallback using Web Speech API
  const speakWithBrowserTTS = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('Tarayıcı TTS desteklenmiyor'))
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'tr-TR'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      // Try to find a Turkish voice
      const voices = window.speechSynthesis.getVoices()
      const turkishVoice = voices.find(v => v.lang.startsWith('tr'))
      if (turkishVoice) {
        utterance.voice = turkishVoice
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        reject(new Error(`TTS hatasi: ${event.error}`))
      }

      window.speechSynthesis.speak(utterance)
    })
  }, [])

  // Text-to-Speech: Make AI speak (with browser TTS fallback)
  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true)

    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If OpenAI TTS fails (quota, API key, etc.), use browser TTS as fallback
        console.warn('OpenAI TTS failed, using browser TTS fallback:', data.error)
        await speakWithBrowserTTS(text)
        return
      }

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(data.audio)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
      }

      audio.onerror = () => {
        // If audio fails to load, try browser TTS
        console.warn('Audio failed to load, using browser TTS fallback')
        speakWithBrowserTTS(text).catch(() => {
          setIsSpeaking(false)
          options.onError?.('Ses kaynağı yüklenemedi')
        })
      }

      options.onAIAudioReady?.(data.audio)
      await audio.play()

    } catch (error) {
      // Network error or other issues - try browser TTS
      console.warn('TTS error, using browser TTS fallback:', error)
      try {
        await speakWithBrowserTTS(text)
      } catch (fallbackError) {
        setIsSpeaking(false)
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'TTS hatasi'
        options.onError?.(errorMessage)
      }
    }
  }, [options, speakWithBrowserTTS])

  // Start listening to user speech
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [isListening])

  // Stop AI speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsSpeaking(false)
    }
  }, [])

  // Send message and speak response
  const askAndSpeak = useCallback(async (message: string) => {
    const response = await sendMessage(message)
    if (response) {
      await speakText(response)
    }
    return response
  }, [sendMessage, speakText])

  // Initialize interview with greeting
  const startInterview = useCallback(async () => {
    const greeting = 'Merhaba! Ben AI Coach, mülakat asistanın. Bugün seninle mülakat yapacağım. Hazır olduğun zaman bana söyle, ilk sorumuza başlayalım.'
    setMessages([{ role: 'assistant', content: greeting }])
    await speakText(greeting)
    return greeting
  }, [speakText])

  // Get next question from AI
  const getNextQuestion = useCallback(async (questionType: 'audio' | 'video' | 'followUp' = 'audio') => {
    const prompt = AI_CONFIG.interview.questionPrompts[questionType]
    return askAndSpeak(prompt)
  }, [askAndSpeak])

  // Process user's answer and get AI's follow-up response
  const processAnswerAndContinue = useCallback(async (userAnswer: string) => {
    if (!userAnswer.trim()) return null

    // Send user's answer to AI and get evaluation + next question
    const aiPrompt = `Adayın cevabı: "${userAnswer}"

${AI_CONFIG.interview.questionPrompts.followUp}`

    const response = await sendMessage(aiPrompt)
    if (response) {
      await speakText(response)
    }
    return response
  }, [sendMessage, speakText])

  // Check for Web Speech API support
  const hasWebSpeechAPI = typeof window !== 'undefined' && 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in (window as any)))

  return {
    messages,
    isLoading,
    isSpeaking,
    isListening,
    transcript,
    sendMessage,
    speakText,
    startListening,
    stopListening,
    stopSpeaking,
    askAndSpeak,
    startInterview,
    getNextQuestion,
    processAnswerAndContinue,
    hasWebSpeechAPI,
  }
}
