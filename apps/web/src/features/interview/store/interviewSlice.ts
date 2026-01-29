import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InterviewState, InterviewField } from '../types';

const initialState: InterviewState = {
  selectedField: null,
  questions: [
    {
      id: '1',
      type: 'audio',
      text: 'Kendinizi kısaca tanıtır mısınız? Yazılım geliştirme alanındaki deneyimlerinizden ve bu alandaki kariyer hedeflerinizden bahseder misiniz?',
      timeLimit: 300,
    },
    {
      id: '2',
      type: 'video',
      text: 'Kariyerinizde karşılaştığınız en zorlu teknik problemi ve bu problemi nasıl çözdüğünüzü anlatır mısınız?',
      timeLimit: 300,
    },
    {
      id: '3',
      type: 'mcq',
      text: 'Aşağıdakilerden hangisi RESTful API tasarım prensiplerinden biri değildir?',
      options: [
        'Stateless (Durumsuz) iletişim',
        'Uniform Interface (Tek tip arayüz)',
        'Session tabanlı kimlik doğrulama',
        'Client-Server mimarisi',
      ],
      timeLimit: 180,
    },
    {
      id: '4',
      type: 'coding',
      text: 'Verilen dizi içindeki en büyük ikinci sayıyı bulan bir fonksiyon yazınız. Dizi en az 2 farklı eleman içermelidir.',
      code: `// JavaScript çözümü
function findSecondLargest(arr) {
  // Kodunuzu buraya yazın
  
}

// Örnek kullanım:
// findSecondLargest([3, 1, 4, 1, 5, 9, 2, 6]) -> 6
// findSecondLargest([10, 5, 8, 12, 3]) -> 10`,
      timeLimit: 1200,
    },
  ],
  currentQuestionIndex: 0,
  totalQuestions: 4,
  timeRemaining: 300,
  isTimerRunning: false,
  answers: {},
  isInterviewStarted: false,
  isInterviewCompleted: false,
  isDemoCompleted: false,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setSelectedField: (state, action: PayloadAction<InterviewField>) => {
      state.selectedField = action.payload;
    },

    startInterview: (state) => {
      state.isInterviewStarted = true;
      state.currentQuestionIndex = 0;
      state.timeRemaining = state.questions[0]?.timeLimit ?? 300;
      state.isTimerRunning = true;
    },
    
    completeDemo: (state) => {
      state.isDemoCompleted = true;
    },
    
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.totalQuestions - 1) {
        state.currentQuestionIndex += 1;
        state.timeRemaining = state.questions[state.currentQuestionIndex]?.timeLimit ?? 300;
        state.isTimerRunning = true;
      } else {
        state.isInterviewCompleted = true;
        state.isTimerRunning = false;
      }
    },
    
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        state.timeRemaining = state.questions[state.currentQuestionIndex]?.timeLimit ?? 300;
      }
    },
    
    setAnswer: (state, action: PayloadAction<{ questionId: string; answer: string | string[] }>) => {
      state.answers[action.payload.questionId] = action.payload.answer;
    },
    
    decrementTimer: (state) => {
      if (state.timeRemaining > 0 && state.isTimerRunning) {
        state.timeRemaining -= 1;
      }
    },
    
    pauseTimer: (state) => {
      state.isTimerRunning = false;
    },
    
    resumeTimer: (state) => {
      state.isTimerRunning = true;
    },
    
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    
    completeInterview: (state) => {
      state.isInterviewCompleted = true;
      state.isTimerRunning = false;
    },
    
    resetInterview: () => {
      return initialState;
    },
  },
});

export const {
  setSelectedField,
  startInterview,
  completeDemo,
  nextQuestion,
  previousQuestion,
  setAnswer,
  decrementTimer,
  pauseTimer,
  resumeTimer,
  setTimeRemaining,
  completeInterview,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;
