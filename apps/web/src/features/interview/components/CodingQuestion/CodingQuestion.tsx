'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { completeInterview, decrementTimer, setAnswer } from '../../store/interviewSlice'
import QuestionProgressBar from '../../../../common/components/QuestionProgressBar'
import InterviewFooter from '../../../../common/components/InterviewFooter'
import './coding-question.styles.scss'

// Dynamic import Monaco Editor (client-side only)
const Editor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="coding-question__editor-loading">
      <div className="coding-question__spinner" />
      <span>Editor yukleniyor...</span>
    </div>
  )
})

type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp'

interface LanguageOption {
  id: Language
  label: string
  extension: string
}

const LANGUAGES: LanguageOption[] = [
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'typescript', label: 'TypeScript', extension: 'ts' },
  { id: 'python', label: 'Python', extension: 'py' },
  { id: 'java', label: 'Java', extension: 'java' },
  { id: 'cpp', label: 'C++', extension: 'cpp' },
]

const DEFAULT_CODE: Record<Language, string> = {
  javascript: `// JavaScript cozumu
function findSecondLargest(arr) {
  // Kodunuzu buraya yazin
  
}

// Ornek kullanim:
// findSecondLargest([3, 1, 4, 1, 5, 9, 2, 6]) -> 6
// findSecondLargest([10, 5, 8, 12, 3]) -> 10`,
  
  typescript: `// TypeScript cozumu
function findSecondLargest(arr: number[]): number {
  // Kodunuzu buraya yazin
  
}

// Ornek kullanim:
// findSecondLargest([3, 1, 4, 1, 5, 9, 2, 6]) -> 6
// findSecondLargest([10, 5, 8, 12, 3]) -> 10`,
  
  python: `# Python cozumu
def find_second_largest(arr):
    # Kodunuzu buraya yazin
    pass

# Ornek kullanim:
# find_second_largest([3, 1, 4, 1, 5, 9, 2, 6]) -> 6
# find_second_largest([10, 5, 8, 12, 3]) -> 10`,
  
  java: `// Java cozumu
public class Solution {
    public static int findSecondLargest(int[] arr) {
        // Kodunuzu buraya yazin
        return 0;
    }
    
    // Ornek kullanim:
    // findSecondLargest(new int[]{3, 1, 4, 1, 5, 9, 2, 6}) -> 6
    // findSecondLargest(new int[]{10, 5, 8, 12, 3}) -> 10
}`,
  
  cpp: `// C++ cozumu
#include <vector>
using namespace std;

int findSecondLargest(vector<int>& arr) {
    // Kodunuzu buraya yazin
    return 0;
}

// Ornek kullanim:
// findSecondLargest({3, 1, 4, 1, 5, 9, 2, 6}) -> 6
// findSecondLargest({10, 5, 8, 12, 3}) -> 10`,
}

const CodingQuestion = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const editorRef = useRef<unknown>(null)
  
  const { currentQuestionIndex, questions, timeRemaining, isTimerRunning } = useAppSelector(
    (state) => state.interview
  )
  
  const currentQuestion = questions[currentQuestionIndex]
  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState(currentQuestion?.code ?? DEFAULT_CODE.javascript)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark')

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

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    setCode(DEFAULT_CODE[newLanguage])
    setOutput('')
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Kod calistiriliyor...\n')
    
    // Simulate code execution (in a real app, this would call a sandboxed execution API)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (language === 'javascript' || language === 'typescript') {
        try {
          // Very basic JS execution (not secure, just for demo)
          const result = new Function(code + '\nreturn typeof findSecondLargest === "function" ? findSecondLargest([3, 1, 4, 1, 5, 9, 2, 6]) : "Fonksiyon bulunamadi"')()
          setOutput(`> Cikti: ${result}\n\n✓ Kod basariyla calistirildi.`)
        } catch (err) {
          setOutput(`✗ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`)
        }
      } else {
        setOutput(`[${LANGUAGES.find(l => l.id === language)?.label}]\n\n⚠ Bu dil icin sunucu tarafli calistirma gerekli.\nBackend entegrasyonundan sonra aktif olacak.`)
      }
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = () => {
    dispatch(setAnswer({ questionId: currentQuestion?.id ?? '', answer: code }))
    dispatch(completeInterview())
    router.push('/interview/result')
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
          {/* Question Panel */}
          <div className="coding-question__question-panel">
            <div className="coding-question__text-container">
              <h3 className="coding-question__subtitle">Soru</h3>
              <p className="coding-question__text">
                {currentQuestionIndex + 1}. {currentQuestion?.text}
              </p>
            </div>
            
            {/* Output Console */}
            <div className="coding-question__console">
              <h3 className="coding-question__subtitle">Konsol Ciktisi</h3>
              <pre className="coding-question__output">
                {output || 'Kodu calistirmak icin "Calistir" butonuna tiklayin.'}
              </pre>
            </div>
          </div>
          
          {/* Editor Panel */}
          <div className="coding-question__editor-panel">
            {/* Toolbar */}
            <div className="coding-question__toolbar">
              <div className="coding-question__language-select">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    className={`coding-question__lang-btn ${language === lang.id ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang.id)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              
              <div className="coding-question__toolbar-actions">
                <button 
                  className="coding-question__theme-btn"
                  onClick={() => setTheme(t => t === 'vs-dark' ? 'light' : 'vs-dark')}
                  title="Tema Degistir"
                >
                  {theme === 'vs-dark' ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
            
            {/* Monaco Editor */}
            <div className="coding-question__editor">
              <Editor
                height="400px"
                language={language === 'cpp' ? 'cpp' : language}
                theme={theme}
                value={code}
                onChange={(value) => setCode(value ?? '')}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16 },
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="coding-question__actions">
              <button 
                className="coding-question__btn coding-question__btn--run"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <span className="coding-question__btn-spinner" />
                    Calistiriliyor...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                    Calistir
                  </>
                )}
              </button>
              
              <button 
                className="coding-question__btn coding-question__btn--reset"
                onClick={() => setCode(DEFAULT_CODE[language])}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Sifirla
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <InterviewFooter 
        buttonText="Gonder ve Tamamla" 
        onButtonClick={handleSubmit}
        showMediaStatus={false}
        showWebcam={false}
      />
    </div>
  )
}

export default CodingQuestion
